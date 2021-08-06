import { gFilter, gMap } from './generators';
import { KeyedSet } from './keyed-set';

export function wrap<TElement>(iterable: IterableIterator<TElement>) : FancyIterator<TElement> {
  return new FancyIterator<TElement>(iterable[Symbol.iterator]());
}

export class FancyIterator<TElement> implements Iterable<TElement>{

  constructor(private readonly source: IterableIterator<TElement>) {}

  public [Symbol.iterator]() : Iterator<TElement> {
    return this.source;
  }

  public map<TResult>(callback: (element: TElement, index: number) => TResult, thisArg?: any) : FancyIterator<TResult> {
    return wrap(gMap(this.source, callback, thisArg));
  }

  public filter(predicate: (element: TElement, index: number) => boolean, thisArg?: any) : FancyIterator<TElement> {
    return wrap(gFilter(this.source, predicate, thisArg));
  }

  public indexOf(predicate: (element: TElement, index: number) => boolean, thisArg?: any) : number {
    let index = -1;
    for (const item of this.source) {
      if (predicate.call(thisArg ?? null, item, ++index)) return index;
    }
    return -1;
  }

  public some(predicate: (element: TElement, index: number) => boolean, thisArg?: any) : boolean {
    return this.indexOf(predicate, thisArg) > -1;
  }

  public every(predicate: (element: TElement, index: number) => boolean, thisArg?: any) : boolean {
    return this.indexOf((e, i) => !predicate.call(thisArg ?? null, e, i), thisArg) === -1;
  }

  public includes(element: TElement, fromIndex: number = 0) : boolean {
    return this.some((e, i) => i >= fromIndex && e === element);
  }

  public toArray() : TElement[] {
    return Array.from(this.source);
  }

  public toSet() : Set<TElement> {
    return new Set(this.source);
  }

  public toKeyedSet<TKey>(key: (element: TElement) => TKey) : KeyedSet<TElement, TKey> {
    return new KeyedSet<TElement, TKey>(key, this.source);
  }
}
