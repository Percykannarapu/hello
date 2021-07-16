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
