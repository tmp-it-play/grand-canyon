import * as THREE from 'three';

// 평평한 판만 만든다. 높이·면 음영·색은 셰이더(terrainMaterial.ts)가 매 프레임 계산한다
export function buildTerrain(size: number, seg: number) {
  const geo = new THREE.PlaneGeometry(size, size, seg, seg).rotateX(-Math.PI / 2);
  // flatShading은 화면 미분으로 면 노멀을 구하므로 normal도 필요 없다
  geo.deleteAttribute('uv');
  geo.deleteAttribute('normal');
  return geo;
}
