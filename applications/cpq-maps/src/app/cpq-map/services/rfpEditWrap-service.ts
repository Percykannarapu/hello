
import { Injectable } from '@angular/core';
import { RfpUiEditWrap } from '../../val-modules/mediaexpress/models/RfpUiEditWrap';
import { FullState } from '../state';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';
import { Store } from '@ngrx/store';
import { UpsertRfpUiEditDetail, UpsertRfpUiEditDetails } from '../state/rfpUiEditDetail/rfp-ui-edit-detail.actions';
import { UpsertRfpUiEditWraps } from '../state/rfpUiEditWrap/rfp-ui-edit-wrap.actions';

@Injectable({
  providedIn: 'root'
})
export class RfpUiEditWrapService {

  constructor(private store$: Store<FullState>) { }

  public toggleWrapZoneGeos(editWraps: RfpUiEditWrap[], state: FullState) {
    const wrapZones: Set<string> = new Set<string>();
    editWraps.forEach(er => wrapZones.add(er.wrapZone));
    if (wrapZones.size > 1) {
      console.warn('Detected wrap zone update for multiple wrap zones, this won\'t work correctly!');
      return;
    }
    const recordUpdates: Array<RfpUiEditDetail> = [];
    for (const id of state.rfpUiEditDetail.ids) {
      const record = state.rfpUiEditDetail.entities[id];
      if (wrapZones.has(record.wrapZone)) {
        const recordUpdate: RfpUiEditDetail = Object.assign({}, record);
        recordUpdate.isSelected = !recordUpdate.isSelected;
        recordUpdates.push(recordUpdate);
      }
    }
    this.store$.dispatch(new UpsertRfpUiEditDetails({ rfpUiEditDetails: recordUpdates }));
  }

  public toggleWrapZone(wrapZone: string, state: FullState) {
    const editWraps: Array<RfpUiEditWrap> = [];
    for (const id of state.rfpUiEditWrap.ids) {
      const record = state.rfpUiEditWrap.entities[id];
      if (record.wrapZone === wrapZone) {
        record.isSelected = !record.isSelected;
        editWraps.push(record);
      }
    }
    this.store$.dispatch(new UpsertRfpUiEditWraps({ rfpUiEditWraps: editWraps }));
  }

}