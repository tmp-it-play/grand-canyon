// MeshStandardMaterial vertex shader의 #include <common> 뒤에 삽입된다 (terrainMaterial.ts)

uniform float uBase, uBigGap, uBigAmp, uSmallGap, uSmallAmp, uCanyonWidth, uStep;
flat varying float vH;

// 칸 좌표마다 고정된 무작위 값 (0~1). three.js <common>에 rand()가 이미 있어 이름을 바꿈
float cellRand(vec2 i) {
  return fract(sin(i.x * 127.1 + i.y * 311.7) * 43758.5453);
}

// gap 칸마다 무작위 높이를 정하고, 그 사이를 자연스럽게 잇는다
float noise(vec2 p, float gap) {
  vec2 g = p / gap;
  vec2 i = floor(g);
  vec2 f = smoothstep(0.0, 1.0, g - i);
  return mix(
    mix(cellRand(i), cellRand(i + vec2(1.0, 0.0)), f.x),
    mix(cellRand(i + vec2(0.0, 1.0)), cellRand(i + 1.0), f.x),
    f.y
  );
}

// 강이 흐르는 선
float riverZ(float x) {
  return sin(x * 0.02) * 50.0;
}

// p = (x, z)
float height(vec2 p) {
  float h = uBase + noise(p, uBigGap) * uBigAmp;  // 1. 큰 간격 노이즈 → 비탈
  h += noise(p, uSmallGap) * uSmallAmp;          // 2. 작은 간격 노이즈 → 돌멩이
  float d = abs(p.y - riverZ(p.x));
  h *= min(d / uCanyonWidth, 1.0);               // 3. 협곡 깎기
  return floor(h / uStep) * uStep;               // 4. 계단 지층
}

// 평평한 판의 꼭짓점을 높이만큼 올린다. 색칠에 쓸 높이도 vH로 넘긴다
vec3 terrainPosition(vec3 p) {
  p.y = height(p.xz);
  vH = p.y;
  return p;
}
