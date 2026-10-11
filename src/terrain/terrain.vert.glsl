// MeshStandardMaterial vertex shader의 #include <common> 뒤에 삽입된다 (terrainMaterial.ts)

uniform float uCanyonWidth, uStep;
attribute float aRiverDist; // 가장 가까운 강기슭까지 거리, 강 안쪽은 음수 (buildTerrain.ts)
flat varying float vH;

// 노이즈 높이는 CPU(buildTerrain.ts)가 position.y에 넣어 둔다. 여기선 슬라이더로 바로 바뀌는 부분만 한다
vec3 terrainPosition(vec3 p) {
  p.y *= clamp(aRiverDist / uCanyonWidth, 0.0, 1.0); // 3. 협곡 깎기 (강 안쪽은 음수라 0)
  p.y = floor(p.y / uStep) * uStep;                  // 4. 계단 지층
  vH = p.y;
  return p;
}
