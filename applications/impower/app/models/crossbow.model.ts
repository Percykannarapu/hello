export type CrossbowGroupTuple = [number, string];

export interface CrossbowProfileResponse {
  modifiedDate: string;
  name: string;
  profileId: number;
}

export class CrossbowProfile {
  name: string;
  profileId: number;
  modifiedDate: Date;
  constructor(response: CrossbowProfileResponse) {
    this.name = response.name;
    this.profileId = response.profileId;
    this.modifiedDate = new Date(Date.parse(response.modifiedDate));
  }
}

export interface CrossbowSite {
  pk: number;
  xcoord: number;
  ycoord: number;
  siteType: number;
  siteId: string;
  name: string;
  owner: string;
  franchisee: string;
  address: string;
  crossStreet: string;
  city: string;
  state: string;
  zip: string;
  taSource: number;
  createType: number;
  grouping: string;
}
