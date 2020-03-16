/* SystemJS module definition */
declare var module: NodeModule;
interface NodeModule {
  id: string;
}

declare var msgpack: MessagePack;
interface MessagePack {
  serialize(data: any) : Uint8ClampedArray;
  deserialize(array: [] | ArrayBuffer | Uint8Array) : any;
}
