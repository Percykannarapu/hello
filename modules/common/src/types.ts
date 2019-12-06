// fixes Array.isArray not typing a readonly array as an array
declare global {
  interface ArrayConstructor {
    isArray(arg: any) : arg is ReadonlyArray<any>;
  }
}

/**
 * Creates a Partial<T> for a nested object hierarchy
 */
export type DeepPartial<T> = unknown extends T ? T : {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer R>
      ? ReadonlyArray<DeepPartial<R>>
      : DeepPartial<T[P]>
};

/**
 * Removes properties via Omit<T, V> from a nested object hierarchy
 * The omission of properties only happens when a property extends type U
 * To omit multiple properties, use syntax such as
 *    DeepOmit<T, U, 'a' | 'b'>
 *    where 'a' and 'b' are properties of type U to omit from the final result T
 */
export type DeepOmit<T, U, V extends keyof U> = unknown extends T ? T : {
  [P in keyof T]: T[P] extends U
    ? Omit<T[P], V>
    : T[P] extends Array<infer S>
      ? Array<DeepOmit<S, U, V>>
      : T[P] extends ReadonlyArray<infer R>
        ? ReadonlyArray<DeepOmit<R, U, V>>
        : DeepOmit<T[P], U, V>
};
