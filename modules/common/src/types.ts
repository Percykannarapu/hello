// fixes Array.isArray not typing a readonly array as an array
declare global {
  interface ArrayConstructor {
    isArray(arg: any) : arg is ReadonlyArray<any>;
  }
}

export type DeepPartial<T> = unknown extends T ? T : {
  [P in keyof T]?: T[P] extends Array<infer U>
    ? Array<DeepPartial<U>>
    : T[P] extends ReadonlyArray<infer R>
      ? ReadonlyArray<DeepPartial<R>>
      : DeepPartial<T[P]>
};
