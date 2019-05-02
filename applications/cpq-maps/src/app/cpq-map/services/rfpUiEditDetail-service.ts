import { Injectable } from '@angular/core';
import { RfpUiEditDetail } from 'src/app/val-modules/mediaexpress/models/RfpUiEditDetail';
import { FullState } from '../state';
import { stringify } from '@angular/core/src/util';


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

  public getEditDetailsByATZDesignator(state: FullState) : Map<string, RfpUiEditDetail[]> {
    const editDetails: Map<string, RfpUiEditDetail[]> = new Map<string, RfpUiEditDetail[]>();
    for (const id of state.rfpUiEditDetail.ids) {
      const record = state.rfpUiEditDetail.entities[id];
      if (record.geocode.length > 5) {
        const designator = record.geocode.substring(5, record.geocode.length);
        if (editDetails.has(designator)) {
          editDetails.get(designator).push(record);
        } else {
          editDetails.set(designator, [record]);
        }
      } else {
        if (editDetails.has(record.geocode)) {
          editDetails.get(record.geocode).push(record);
        } else {
          editDetails.set(record.geocode, [record]);
        }
      }
    }
    return editDetails;
  }

  public getEditDetailsByWrapZone(state: FullState) : Map<string, RfpUiEditDetail[]> {
    const editDetails: Map<string, RfpUiEditDetail[]> = new Map<string, RfpUiEditDetail[]>();
    for (const id of state.rfpUiEditDetail.ids) {
      const record = state.rfpUiEditDetail.entities[id];
      if (editDetails.has(record.wrapZone))
        editDetails.get(record.wrapZone).push(record);
      else
        editDetails.set(record.wrapZone, [record]);
    }
    return editDetails;
  }

}