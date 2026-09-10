/**
 * Merge sort implementation for sorting corridor edges and candidate plots.
 * Provides stable, deterministic O(N log N) sorting with a custom comparator.
 */

/**
 * Sorts an array using the divide-and-conquer merge sort algorithm.
 * Recursively divides elements in half, sorts each half, and merges sorted subarrays.
 */
export function mergeSort<T>(arr: ReadonlyArray<T>, comparator: (a: T, b: T) => number): T[] {
  if (arr.length <= 1) {
    return arr.slice();
  }

  const mid = Math.floor(arr.length / 2);
  const left = mergeSort(arr.slice(0, mid), comparator);
  const right = mergeSort(arr.slice(mid), comparator);

  return merge(left, right, comparator);
}

/**
 * Merges two previously sorted subarrays into a single ordered array.
 * Iteratively selects the smaller head element from the two lists using the comparator.
 */
function merge<T>(left: T[], right: T[], comparator: (a: T, b: T) => number): T[] {
  const result: T[] = [];
  let i = 0;
  let j = 0;

  while (i < left.length && j < right.length) {
    if (comparator(left[i], right[j]) <= 0) {
      result.push(left[i++]);
    } else {
      result.push(right[j++]);
    }
  }

  while (i < left.length) {
    result.push(left[i++]);
  }

  while (j < right.length) {
    result.push(right[j++]);
  }

  return result;
}
