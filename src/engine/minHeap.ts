/**
 * Min-heap priority queue implementation for Dijkstra's shortest path algorithm.
 * Maintains minimum-priority element at root using standard binary heap operations.
 */

export interface HeapNode<T> {
  readonly element: T;
  readonly priority: number;
}

/**
 * A generic binary min-heap for priority-ordered retrieval.
 * Provides logarithmic insertion and extraction of lowest-priority elements.
 */
export class MinHeap<T> {
  private heap: HeapNode<T>[] = [];

  /**
   * Returns current count of items stored in the priority queue.
   * O(1) query of underlying dynamic array length.
   */
  public size(): number {
    return this.heap.length;
  }

  /**
   * Indicates whether the priority queue contains any elements.
   * Returns true when size is zero.
   */
  public isEmpty(): boolean {
    return this.heap.length === 0;
  }

  /**
   * Inspects the item with the smallest priority without removing it.
   * Returns root element at index 0 or undefined if empty.
   */
  public peek(): HeapNode<T> | undefined {
    return this.heap[0];
  }

  /**
   * Inserts a new element with associated numeric priority into the heap.
   * Appends to the array and bubbles up until heap invariant holds.
   */
  public push(element: T, priority: number): void {
    const node: HeapNode<T> = { element, priority };
    this.heap.push(node);
    this.bubbleUp(this.heap.length - 1);
  }

  /**
   * Removes and returns the element with the smallest priority value.
   * Swaps root with leaf, pops last element, and trickles root down.
   */
  public pop(): HeapNode<T> | undefined {
    if (this.heap.length === 0) return undefined;
    const top = this.heap[0];
    const bottom = this.heap.pop()!;
    if (this.heap.length > 0) {
      this.heap[0] = bottom;
      this.trickleDown(0);
    }
    return top;
  }

  /**
   * Restores min-heap property by bubbling an element upwards toward the root.
   * Compares child with parent and swaps if child priority is smaller.
   */
  private bubbleUp(index: number): void {
    let curr = index;
    while (curr > 0) {
      const parent = (curr - 1) >> 1;
      if (this.heap[curr].priority < this.heap[parent].priority) {
        const temp = this.heap[curr];
        this.heap[curr] = this.heap[parent];
        this.heap[parent] = temp;
        curr = parent;
      } else {
        break;
      }
    }
  }

  /**
   * Restores min-heap property by sinking an element downwards toward the leaves.
   * Finds smallest child and swaps until current element is smaller than both children.
   */
  private trickleDown(index: number): void {
    const len = this.heap.length;
    let curr = index;

    while (true) {
      const left = (curr << 1) + 1;
      const right = left + 1;
      let smallest = curr;

      if (left < len && this.heap[left].priority < this.heap[smallest].priority) {
        smallest = left;
      }
      if (right < len && this.heap[right].priority < this.heap[smallest].priority) {
        smallest = right;
      }

      if (smallest !== curr) {
        const temp = this.heap[curr];
        this.heap[curr] = this.heap[smallest];
        this.heap[smallest] = temp;
        curr = smallest;
      } else {
        break;
      }
    }
  }
}
