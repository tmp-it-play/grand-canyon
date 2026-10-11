// 실행: node src/terrain/flow.check.ts
import { flowAccumulation } from './buildTerrain.ts';

const eq = (actual: number[], expected: number[]) => {
  if (actual.join() !== expected.join()) throw new Error(`${actual} !== ${expected}`);
};

// 대화에서 손으로 풀었던 3×3 예제. 5에는 9의 물만 와서 2, 3에는 전부 모여 9
eq([...flowAccumulation([9, 8, 7, 6, 5, 4, 8, 3, 6], 3)], [1, 1, 1, 1, 2, 3, 1, 9, 1]);

// 웅덩이: 가운데 0은 낮은 이웃이 없어도 채워진 뒤 가장 낮은 턱(2)으로 넘쳐, 전부 2를 지나간다
eq([flowAccumulation([5, 5, 5, 5, 0, 2, 5, 5, 5], 3)[5]], [9]);
console.log('ok');
