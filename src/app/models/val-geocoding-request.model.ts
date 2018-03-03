
export class ValGeocodingRequest {
  name: string;
  number: string;
  market: string;
  street: string;
  city: string;
  state: string;
  zip: string;
  [key: string] : any;

  constructor(initializer: any) {
    Object.assign(this, initializer);
  }
}
