import { gMap } from './generators';
import { isNil, isNotNil } from './type-checks';

export class KeyedSet<T, K> {

  public readonly [Symbol.toStringTag]: string;
  public readonly size: number;

  private _data: Map<K, T>;

  constructor(private key: (item: T) => K, sourceItems?: Iterable<T>) {
    if (isNil(key)) throw new ReferenceError('The key value passed in to the KeyedSet ctor cannot be null or undefined.');
    if (isNotNil(sourceItems)) {
      this._data = new Map(gMap(sourceItems, item => ([this.key(item), item] as const)));
    } else {
      this._data = new Map();
    }
  }

  public [Symbol.iterator]() : IterableIterator<T> {
    return this._data.values();
  }

  public add(value: T) : this {
    this._data.set(this.key(value), value);
    return this;
  }

  public clear() : void {
    this._data.clear();
  }

  public delete(value: T) : boolean {
    return this._data.delete(this.key(value));
  }

  public entries() : IterableIterator<[K, T]> {
    return this._data.entries();
  }

  public forEach(callbackfn: (value: T, key: K, set: KeyedSet<T, K>) => void, thisArg?: any) : void {
    const that = this;
    this._data.forEach((v, k) => {
      callbackfn(v, k, that);
    }, thisArg);
  }

  public has(value: T) : boolean {
    return this._data.has(this.key(value));
  }

  public keys() : IterableIterator<K> {
    return this._data.keys();
  }

  public values() : IterableIterator<T> {
    return this._data.values();
  }
}
