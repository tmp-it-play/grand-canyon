import * as THREE from 'three';
import type { TerrainParams } from './config';

// 칸 좌표마다 고정된 무작위 값 (0~1)
function cellRand(x: number, y: number) {
  const v = Math.sin(x * 127.1 + y * 311.7) * 43758.5453;
  return v - Math.floor(v);
}

// gap 칸마다 무작위 높이를 정하고, 그 사이를 자연스럽게 잇는다
function noise(x: number, z: number, gap: number) {
  const gx = x / gap, gz = z / gap;
  const ix = Math.floor(gx), iz = Math.floor(gz);
  const s = (t: number) => t * t * (3 - 2 * t); // smoothstep
  const fx = s(gx - ix), fz = s(gz - iz);
  const a = cellRand(ix, iz) + (cellRand(ix + 1, iz) - cellRand(ix, iz)) * fx;
  const b = cellRand(ix, iz + 1) + (cellRand(ix + 1, iz + 1) - cellRand(ix, iz + 1)) * fx;
  return a + (b - a) * fz;
}

// 1. 큰 간격 노이즈 → 비탈, 2. 작은 간격 노이즈 → 돌멩이. 협곡·계단은 셰이더가 깎는다
function height(x: number, z: number, p: TerrainParams) {
  return p.base + noise(x, z, p.bigGap) * p.bigAmp + noise(x, z, p.smallGap) * p.smallAmp;
}

// 대각선까지 8방향 이웃
const DIRS = [[-1, -1], [0, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [0, 1], [1, 1]];

// n×n 격자에서 (x, y)의 이웃 번호마다 fn을 부른다
function eachNeighbor(i: number, n: number, fn: (j: number, dx: number, dy: number) => void) {
  const x = i % n, y = (i - x) / n;
  for (const [dx, dy] of DIRS) {
    const nx = x + dx, ny = y + dy;
    if (nx >= 0 && ny >= 0 && nx < n && ny < n) fn(ny * n + nx, dx, dy);
  }
}

// 웅덩이를 가장 낮은 턱 높이까지 채운다 (Priority-Flood, Barnes 2014).
// 가장자리(물이 빠져나가는 곳)부터 낮은 칸 순으로 안쪽으로 번진다.
// 이웃이 나보다 낮으면 웅덩이이므로 나보다 살짝 높게 채워 물이 턱을 넘어 흐르게 한다.
// 꺼낸 순서가 곧 채운 높이의 오름차순이라, 뒤집으면 흐름 누적에 쓸 내림차순이 된다
function fillPits(h: ArrayLike<number>, n: number) {
  const f = Float64Array.from(h);
  const seen = new Uint8Array(f.length);
  const order: number[] = [];
  const heap: number[] = []; // f가 낮은 칸 번호가 맨 앞
  const push = (i: number) => {
    let k = heap.push(i) - 1;
    while (k > 0) {
      const up = (k - 1) >> 1;
      if (f[heap[up]] <= f[i]) break;
      heap[k] = heap[up];
      k = up;
    }
    heap[k] = i;
  };
  const pop = () => {
    const top = heap[0], last = heap.pop()!;
    if (heap.length) {
      let k = 0;
      for (;;) {
        let c = 2 * k + 1;
        if (c >= heap.length) break;
        if (c + 1 < heap.length && f[heap[c + 1]] < f[heap[c]]) c++;
        if (f[heap[c]] >= f[last]) break;
        heap[k] = heap[c];
        k = c;
      }
      heap[k] = last;
    }
    return top;
  };

  for (let i = 0; i < f.length; i++) {
    const x = i % n, y = (i - x) / n;
    if (x === 0 || y === 0 || x === n - 1 || y === n - 1) (seen[i] = 1), push(i);
  }
  while (heap.length) {
    const c = pop();
    order.push(c);
    eachNeighbor(c, n, (j) => {
      if (seen[j]) return;
      seen[j] = 1;
      f[j] = Math.max(f[j], f[c] + 1e-6);
      push(j);
    });
  }
  return { f, order: order.reverse() };
}

// 칸마다 비 1씩 내린 뒤 그 칸을 지나가는 물의 양 (= 배수 면적, 칸 개수 단위)
// 높은 칸부터 방문하며 가진 물을 전부 가장 낮은 이웃에 넘긴다. 낮은 이웃이 없으면(가장자리) 밖으로 빠진다
export function flowAccumulation(h: ArrayLike<number>, n: number) {
  const { f, order } = fillPits(h, n);
  const acc = new Float64Array(f.length).fill(1);
  for (const i of order) {
    let low = -1;
    eachNeighbor(i, n, (j) => {
      if (f[j] < (low < 0 ? f[i] : f[low])) low = j;
    });
    if (low >= 0) acc[low] += acc[i];
  }
  return acc;
}

// 가장 가까운 강기슭까지 거리 (칸 단위, 강 안쪽은 음수). 앞→뒤, 뒤→앞 두 번 훑는 chamfer 근사.
// 강 칸을 -반폭에서 출발시키면, 폭이 넓은 강일수록 기슭이 멀리 밀려난다
function distanceToRiver(halfWidth: (i: number) => number | null, n: number) {
  const d = new Float32Array(n * n);
  for (let i = 0; i < d.length; i++) d[i] = -(halfWidth(i) ?? -1e9);
  const relax = (i: number) =>
    eachNeighbor(i, n, (j, dx, dy) => {
      d[i] = Math.min(d[i], d[j] + (dx && dy ? Math.SQRT2 : 1));
    });
  // ponytail: 매 칸 8방향을 다 보므로 정석 chamfer(4방향씩)보다 2배 느리다. seg가 커서 느려지면 반쪽 이웃만 볼 것
  for (let i = 0; i < d.length; i++) relax(i);
  for (let i = d.length - 1; i >= 0; i--) relax(i);
  return d;
}

// 강 반폭 = K·√(강수량 × 배수 면적). 유량 ∝ 강수량 × 배수 면적이고 폭 ∝ √유량 (Leopold & Maddock 1953)
// ponytail: K는 화면을 보고 맞춘 값. 영상의 잠정 폭(B)·깊이 계수(F) 공식을 쓰려면 이 식만 바꿀 것
const K = 0.002;

// 판을 만들고 노이즈 높이를 position.y에 넣는다.
// 흐름 누적으로 강 칸을 찾고, 강까지 거리를 aRiverDist로 넘겨 셰이더가 협곡을 깎게 한다
export function buildTerrain(p: TerrainParams) {
  const geo = new THREE.PlaneGeometry(p.size, p.size, p.seg, p.seg).rotateX(-Math.PI / 2);
  // flatShading은 화면 미분으로 면 노멀을 구하므로 normal도 필요 없다
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');

  // 꼭짓점 i = 행 * n + 열 순서라 격자 번호와 같다
  const n = p.seg + 1;
  const pos = geo.attributes.position;
  const h = new Float64Array(pos.count);
  for (let i = 0; i < pos.count; i++) pos.setY(i, (h[i] = height(pos.getX(i), pos.getZ(i), p)));

  const acc = flowAccumulation(h, n);
  const cell = p.size / p.seg;
  const dist = distanceToRiver((i) => {
    const area = acc[i] * cell * cell;
    return area >= p.riverArea ? (K * Math.sqrt(p.rain * area)) / cell : null;
  }, n).map((v) => v * cell);
  geo.setAttribute('aRiverDist', new THREE.BufferAttribute(dist, 1));
  return geo;
}
