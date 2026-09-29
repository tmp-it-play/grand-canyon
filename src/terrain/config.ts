export type TerrainParams = {
  size: number; // 땅 한 변 길이
  seg: number; // 바둑판 칸 수
  base: number; // 고원 기본 높이
  bigGap: number; // 큰 노이즈 간격 → 비탈 크기
  bigAmp: number; // 큰 노이즈 세기
  smallGap: number; // 작은 노이즈 간격 → 돌멩이 크기
  smallAmp: number; // 작은 노이즈 세기
  canyonWidth: number; // 협곡 폭 (강에서 이 거리부터 원래 높이)
  step: number; // 계단 한 칸 높이
};

export const LAYERS = [
  "#7a3b22",
  "#b5572e",
  "#d98c4a",
  "#c46a3a",
  "#e8b27a",
  "#a4482a",
  "#d4a373",
];

export const RIVER = "#3f7f8c";
