import * as THREE from 'three';
import { LAYERS, RIVER, type TerrainParams } from './config';
import vertexHeader from './terrain.vert.glsl?raw';
import fragmentHeader from './terrain.frag.glsl?raw';

// ponytail: GPU에서만 계산하므로 JS는 높이를 모른다. 충돌 판정 등이 필요해지면 CPU용 height()를 다시 둘 것
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
  material.defines = { LAYER_COUNT: LAYERS.length };
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, uniforms);
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>\n${vertexHeader}`)
      // normal 속성을 지웠으므로 위쪽 방향으로 대신한다.
      // 0 벡터를 두면 그림자 좌표 계산(shadowmap_vertex)에서 NaN이 되어 그림자가 사라진다
      .replace('#include <beginnormal_vertex>', 'vec3 objectNormal = vec3(0.0, 1.0, 0.0);')
      .replace('#include <begin_vertex>', 'vec3 transformed = terrainPosition(position);');
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>\n${fragmentHeader}`)
      .replace('#include <color_fragment>', 'diffuseColor.rgb = terrainColor();');
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
