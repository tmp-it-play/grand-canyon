import { useEffect, useMemo } from "react";
import { createRoot } from "react-dom/client";
import { Canvas } from "@react-three/fiber";
import { OrbitControls } from "@react-three/drei";
import { useControls } from "leva";
import { buildTerrain } from "./terrain/buildTerrain";
import type { TerrainParams } from "./terrain/config";

function Terrain() {
  const params: TerrainParams = useControls("지형", {
    size: {
      value: 400,
      min: 100,
      max: 8000,
      step: 100,
      label: "땅 한 변 길이",
    },
    seg: { value: 200, min: 50, max: 2000, step: 50, label: "바둑판 칸 수" },
    base: { value: 30, min: 0, max: 200, step: 1, label: "고원 기본 높이" },
    bigGap: { value: 80, min: 10, max: 500, step: 5, label: "큰 노이즈 간격" },
    bigAmp: { value: 40, min: 0, max: 200, step: 1, label: "큰 노이즈 세기" },
    smallGap: { value: 8, min: 1, max: 50, step: 1, label: "작은 노이즈 간격" },
    smallAmp: {
      value: 4,
      min: 0,
      max: 30,
      step: 0.5,
      label: "작은 노이즈 세기",
    },
    canyonWidth: { value: 40, min: 1, max: 300, step: 1, label: "협곡 폭" },
    step: { value: 6, min: 1, max: 30, step: 1, label: "계단 높이" },
  });
  const geo = useMemo(() => buildTerrain(params), Object.values(params));
  // 값이 바뀌어 새 지오메트리를 만들면 이전 것은 GPU 메모리에서 해제
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <mesh geometry={geo}>
      <meshStandardMaterial vertexColors flatShading />
    </mesh>
  );
}

createRoot(document.getElementById("root")!).render(
  // flat: R3F 기본 톤매핑을 꺼서 지층 색을 그대로 보이게 한다
  <Canvas flat camera={{ position: [0, 90, 150], fov: 55, far: 2000 }}>
    <color attach="background" args={["#9cc7e8"]} />
    <hemisphereLight args={["#cfe6ff", "#6b3a20", 0.8]} />
    <directionalLight
      color="#fff1d6"
      intensity={2.5}
      position={[-100, 120, 60]}
    />
    <Terrain />
    <OrbitControls />
  </Canvas>,
);
