import type { TerrainParams } from './config';
import { noise } from './noise';
import { riverZ } from './riverZ';

export function height(x: number, z: number, p: TerrainParams) {
  let h = p.base + noise(x, z, p.bigGap) * p.bigAmp;   // 1. 큰 간격 노이즈 → 비탈
  h += noise(x, z, p.smallGap) * p.smallAmp;          // 2. 작은 간격 노이즈 → 돌멩이
  // ponytail: 세로 방향 거리로 근사, 강이 급하게 휘면 선까지의 실제 최단거리로 바꿀 것
  const d = Math.abs(z - riverZ(x));
  h *= Math.min(d / p.canyonWidth, 1);                // 3. 협곡 깎기
  return Math.floor(h / p.step) * p.step;             // 4. 계단 지층
}
