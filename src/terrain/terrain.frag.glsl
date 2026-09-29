// MeshStandardMaterial fragment shader의 #include <common> 뒤에 삽입된다 (terrainMaterial.ts)
// LAYER_COUNT는 material.defines로 들어온다

uniform float uStep;
uniform vec3 uLayers[LAYER_COUNT];
uniform vec3 uRiver;
flat varying float vH;

// 5. 높이에 따라 색 칠하기 → 지층 줄무늬
// flat varying이라 삼각형 하나는 한 꼭짓점(provoking vertex)의 높이로 칠해진다
vec3 terrainColor() {
  return vH < 1.0 ? uRiver : uLayers[int(mod(floor(vH / uStep), float(LAYER_COUNT)))];
}
