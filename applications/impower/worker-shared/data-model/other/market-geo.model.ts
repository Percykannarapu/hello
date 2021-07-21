import { toNullOrNumber } from '@val/common';

export interface ContainerPayload {
  id:       number;
  code:     string;
  name:     string;
  state:    string;
}

export class ContainerValue implements ContainerPayload {
  gridKey:  string;
  id:       number;
  code:     string;
  name:     string;
  state:    string;
  isActive: boolean;
  geocodes: string[];

  constructor(data: ContainerPayload, keyName: keyof ContainerPayload) {
    Object.assign(this, data);
    // just to ensure the payload is interpreted correctly:
    this.id = toNullOrNumber(data.id);
    this.gridKey = `${this[keyName]}`;
    this.isActive = false;
  }
}

export interface KeyedGeocodes {
  [key: string] : string[];
}

