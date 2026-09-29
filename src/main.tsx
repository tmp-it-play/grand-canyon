import { useEffect, useMemo, useRef } from "react";
import { createRoot } from "react-dom/client";
import { Canvas, useFrame } from "@react-three/fiber";
import { OrbitControls, StatsGl } from "@react-three/drei";
import { useControls } from "leva";
import { buildTerrain } from "./terrain/buildTerrain";
import { createTerrainMaterial } from "./terrain/terrainMaterial";
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
  // perf: 값 변경 시작 시각과, 그 뒤 지나간 프레임 수. 판 생성보다 먼저 찍어야 build 시간까지 포함된다
  const perf = useRef({ start: 0, frames: -1 });
  useMemo(() => {
    perf.current = { start: performance.now(), frames: 0 };
  }, Object.values(params));

  // 판은 크기·칸 수가 바뀔 때만 다시 만든다
  const geo = useMemo(() => {
    const start = performance.now();
    const g = buildTerrain(params.size, params.seg);
    const build = performance.now() - start;
    const bytes =
      Object.values(g.attributes).reduce((sum, a) => sum + a.array.byteLength, 0) +
      (g.index?.array.byteLength ?? 0);
    console.log(`[perf] seg=${params.seg} build=${build.toFixed(0)}ms geometry=${(bytes / 1024 ** 2).toFixed(1)}MB`);
    return g;
  }, [params.size, params.seg]);
  const { material, update } = useMemo(createTerrainMaterial, []);
  useEffect(() => () => material.dispose(), [material]);
  // uniform 값 7개를 대입할 뿐이라 매 렌더 실행해도 된다
  update(params);
  // useFrame은 그리기 직전에 불리므로, 두 번째 프레임에서 재야 새 지형을 실제로 그린 시간까지 포함된다
  useFrame(({ gl }) => {
    if (perf.current.frames < 0 || ++perf.current.frames < 2) return;
    const m = performance.measure("terrain-rebuild", { start: perf.current.start });
    console.log(`[perf] seg=${params.seg} 반영=${m.duration.toFixed(0)}ms triangles=${gl.info.render.triangles}`);
    perf.current.frames = -1;
  });
  // 값이 바뀌어 새 지오메트리를 만들면 이전 것은 GPU 메모리에서 해제
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    // 판의 bounding box는 높이 0 기준이라, 솟은 지형이 화면 밖으로 잘못 판정되지 않게 컬링을 끈다
    <mesh geometry={geo} material={material} frustumCulled={false} />
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
    <StatsGl trackGPU />
  </Canvas>,
);
