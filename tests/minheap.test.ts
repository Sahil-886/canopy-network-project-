import { describe, it, expect } from 'vitest';
import { MinHeap } from '../src/engine/minHeap';

describe('MinHeap Priority Queue', () => {
  it('pops elements in monotonically non-decreasing order of priority', () => {
    const heap = new MinHeap<string>();
    const priorities = [42, 12, 88, 3, 25, 99, 1, 14, 3];

    priorities.forEach((p, idx) => {
      heap.push(`item_${idx}`, p);
    });

    expect(heap.size()).toBe(priorities.length);

    const extracted: number[] = [];
    while (!heap.isEmpty()) {
      const top = heap.pop();
      expect(top).toBeDefined();
      extracted.push(top!.priority);
    }

    const expected = [...priorities].sort((a, b) => a - b);
    expect(extracted).toEqual(expected);
  });

  it('handles empty heap operations gracefully', () => {
    const heap = new MinHeap<number>();
    expect(heap.isEmpty()).toBe(true);
    expect(heap.peek()).toBeUndefined();
    expect(heap.pop()).toBeUndefined();
  });
});
