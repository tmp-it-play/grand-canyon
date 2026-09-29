import { useMemo, useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

const CLOUD_COUNT = 6;
const BLOBS_PER_CLOUD = 4;
const CLOUD_Y = 110; // 구름 높이 (기본 지형 최고점보다 위)
const WIND = 4; // 초당 x 방향 이동 거리
const MARGIN = 40; // 땅 밖으로 이만큼 나가면 반대편에서 다시 들어온다

export function Clouds({ size }: { size: number }) {
  const mesh = useRef<THREE.InstancedMesh>(null!);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  // 구름마다 중심 좌표와, 중심 기준 덩어리 배치 (dx, dy, dz, 반지름)
  const clouds = useMemo(
    () =>
      Array.from({ length: CLOUD_COUNT }, () => ({
        x: (Math.random() - 0.5) * size,
        z: (Math.random() - 0.5) * size,
        parts: Array.from(
          { length: BLOBS_PER_CLOUD },
          () =>
            new THREE.Vector4(
              (Math.random() - 0.5) * 30,
              Math.random() * 6,
              (Math.random() - 0.5) * 16,
              10 + Math.random() * 8,
            ),
        ),
      })),
    [size],
  );

  useFrame((_, dt) => {
    clouds.forEach((c, ci) => {
      c.x += WIND * dt;
      if (c.x > size / 2 + MARGIN) c.x -= size + MARGIN * 2;
      c.parts.forEach((p, pi) => {
        const i = ci * BLOBS_PER_CLOUD + pi;
        dummy.position.set(c.x + p.x, CLOUD_Y + p.y, c.z + p.z);
        dummy.scale.set(p.w, p.w * 0.5, p.w); // 납작하게 눌러 구름 덩어리처럼
        dummy.updateMatrix();
        mesh.current.setMatrixAt(i, dummy.matrix);
      });
    });
    mesh.current.instanceMatrix.needsUpdate = true;
  });

  return (
    // 인스턴스 위치가 매 프레임 바뀌어 bounding sphere가 맞지 않으므로 컬링을 끈다
    <instancedMesh ref={mesh} args={[undefined, undefined, CLOUD_COUNT * BLOBS_PER_CLOUD]} frustumCulled={false} castShadow>
      <icosahedronGeometry args={[1, 0]} />
      <meshStandardMaterial color="#ffffff" flatShading />
    </instancedMesh>
  );
}
