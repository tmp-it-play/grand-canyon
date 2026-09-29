import * as THREE from 'three';
import { LAYERS, RIVER, type TerrainParams } from './config';

// ponytail: GPU에서만 계산하므로 JS는 높이를 모른다. 충돌 판정 등이 필요해지면 CPU용 height()를 다시 둘 것
const vertexHeader = /* glsl */ `
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
`;

const fragmentHeader = /* glsl */ `
uniform float uStep;
uniform vec3 uLayers[${LAYERS.length}];
uniform vec3 uRiver;
flat varying float vH;
`;

export function createTerrainMaterial() {
  const uniforms = {
    uBase: { value: 0 },
    uBigGap: { value: 1 },
    uBigAmp: { value: 0 },
    uSmallGap: { value: 1 },
    uSmallAmp: { value: 0 },
    uCanyonWidth: { value: 1 },
    uStep: { value: 1 },
    uLayers: { value: LAYERS.map((c) => new THREE.Color(c)) },
    uRiver: { value: new THREE.Color(RIVER) },
  };

  const material = new THREE.MeshStandardMaterial({ flatShading: true });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHeader}`)
      .replace(
        '#include <begin_vertex>',
        `vec3 transformed = vec3(position);
        transformed.y = height(position.xz);
        vH = transformed.y;`,
      );
    // 5. 높이에 따라 색 칠하기 → 지층 줄무늬
    // flat varying이라 삼각형 하나는 한 꼭짓점(provoking vertex)의 높이로 칠해진다
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentHeader}`)
      .replace(
        '#include <color_fragment>',
        `diffuseColor.rgb = vH < 1.0 ? uRiver : uLayers[int(mod(floor(vH / uStep), ${LAYERS.length}.0))];`,
      );
  };

  // 값이 바뀌면 uniform만 바꾼다. 지오메트리는 다시 만들지 않는다
  const update = (p: TerrainParams) => {
    uniforms.uBase.value = p.base;
    uniforms.uBigGap.value = p.bigGap;
    uniforms.uBigAmp.value = p.bigAmp;
    uniforms.uSmallGap.value = p.smallGap;
    uniforms.uSmallAmp.value = p.smallAmp;
    uniforms.uCanyonWidth.value = p.canyonWidth;
    uniforms.uStep.value = p.step;
  };

  return { material, update };
}
