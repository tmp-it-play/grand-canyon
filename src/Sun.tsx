import { useLayoutEffect, useRef } from 'react';
import * as THREE from 'three';

const SUN_DIR = new THREE.Vector3(-100, 120, 60).normalize();

// 태양 조명 + 구름 그림자용 shadow map
export function Sun({ size }: { size: number }) {
  const light = useRef<THREE.DirectionalLight>(null!);

  // 그림자 카메라가 땅 전체와 그 위의 구름을 덮도록 땅 크기에 맞춘다
  useLayoutEffect(() => {
    const cam = light.current.shadow.camera;
    const half = size * 0.75; // 대각선으로 기운 땅의 투영까지 덮는 여유
    cam.left = -half;
    cam.right = half;
    cam.top = half;
    cam.bottom = -half;
    cam.far = size * 2; // 조명이 원점에서 size만큼 떨어져 있으니 반대편 끝까지
    cam.updateProjectionMatrix();
  }, [size]);

  return (
    <directionalLight
      ref={light}
      color="#fff1d6"
      intensity={2.5}
      // 방향만 의미가 있다. 땅 밖 구름까지 그림자 카메라 앞쪽에 오도록 멀리 둔다
      position={SUN_DIR.clone().multiplyScalar(size)}
      castShadow
      shadow-mapSize={[2048, 2048]}
      shadow-intensity={0.6} // 그늘에서도 직사광 40%는 남긴다 (구름은 반투명하니까)
    />
  );
}
