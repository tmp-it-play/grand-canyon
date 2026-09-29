import { rand } from './rand';

// gap 칸마다 무작위 높이를 정하고, 그 사이를 자연스럽게 잇는다
export function noise(x: number, z: number, gap: number) {
  const ix = Math.floor(x / gap), iz = Math.floor(z / gap);
  const smooth = (t: number) => t * t * (3 - 2 * t);
  const fx = smooth(x / gap - ix), fz = smooth(z / gap - iz);
  const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
  return lerp(
    lerp(rand(ix, iz), rand(ix + 1, iz), fx),
    lerp(rand(ix, iz + 1), rand(ix + 1, iz + 1), fx),
    fz,
  );
}
