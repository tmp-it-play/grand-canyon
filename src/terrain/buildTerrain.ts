import * as THREE from 'three';
import { LAYERS, type TerrainParams } from './config';
import { height } from './height';

export function buildTerrain(params: TerrainParams) {
  const { size, seg, step } = params;
  let geo: THREE.BufferGeometry = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) pos.setY(i, height(pos.getX(i), pos.getZ(i), params));

  // 텍스처를 쓰지 않으니 uv는 메모리만 차지한다
  geo.deleteAttribute('uv');
  // 삼각형마다 꼭짓점을 따로 가져야 면 단위로 색을 칠할 수 있다
  geo = geo.toNonIndexed();
  geo.computeVertexNormals();

  // 5. 높이에 따라 색 칠하기 → 지층 줄무늬
  const p = geo.attributes.position;
  const colors = new Float32Array(p.count * 3);
  const c = new THREE.Color();
  for (let i = 0; i < p.count; i += 3) {
    const y = (p.getY(i) + p.getY(i + 1) + p.getY(i + 2)) / 3;
    c.set(y < 1 ? '#3f7f8c' : LAYERS[Math.floor(y / step) % LAYERS.length]);
    for (let k = 0; k < 3; k++) c.toArray(colors, (i + k) * 3);
  }
  geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));
  return geo;
}
