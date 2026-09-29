// 칸 좌표마다 고정된 무작위 값 (0~1)
export function rand(ix: number, iz: number) {
  const s = Math.sin(ix * 127.1 + iz * 311.7) * 43758.5453;
  return s - Math.floor(s);
}
