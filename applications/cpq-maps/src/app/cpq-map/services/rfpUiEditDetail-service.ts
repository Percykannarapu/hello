import { Injectable } from '@angular/core';
import { RfpUiEditDetail } from 'src/app/val-modules/mediaexpress/models/RfpUiEditDetail';
import { FullState } from '../state';


@Injectable({
  providedIn: 'root'
})
export class RfpUiEditDetailService {

  constructor() { }

  public getEditDetailsByGeocode(geocode: string, state: FullState) : Array<RfpUiEditDetail> {
    const rfpUiEditDetails: Array<RfpUiEditDetail> = [];
    for (const id of state.rfpUiEditDetail.ids) {
      const record = state.rfpUiEditDetail.entities[id];
      if (record.geocode === geocode) {
        rfpUiEditDetails.push(record);
      }
    }
    return rfpUiEditDetails;
  }

  public getSelectedEditDetails(state: FullState) : Array<RfpUiEditDetail> {
    const rfpUiEditDetails: Array<RfpUiEditDetail> = [];
    for (const id of state.rfpUiEditDetail.ids) {
      const record = state.rfpUiEditDetail.entities[id];
      if (record.isSelected) {
        rfpUiEditDetails.push(record);
      }
    }
    return rfpUiEditDetails;
  }

}