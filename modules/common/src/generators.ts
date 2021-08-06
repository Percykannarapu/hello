export function * gMap<T, U>(items: Iterable<T>, callback: (element: T, index: number) => U, thisArg?: any) : Generator<U> {
  let i = 0;
  for (const item of items) {
    yield callback.call(thisArg ?? null, item, i++);
  }
}

export function * gFilter<T>(items: Iterable<T>, predicate: (element: T, index: number) => boolean, thisArg?: any) : Generator<T> {
  let i = 0;
  for (const item of items) {
    if (predicate.call(thisArg ?? null, item, i++)) yield item;
  }
}
