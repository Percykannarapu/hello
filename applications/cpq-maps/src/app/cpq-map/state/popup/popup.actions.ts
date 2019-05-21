import { Action } from '@ngrx/store';
import { AvailabilityDetailResponse } from '../../models/availability-detail-response';

export enum PopupActionTypes {
  PopupGeoToggle = '[Popup Actions] Toggle Geo through Map popup',
  PopupNewGeoAdd = '[Popup Actions] Add New Geo through Map popup'
}

export class PopupGeoToggle implements Action {
  readonly type = PopupActionTypes.PopupGeoToggle;
  constructor(public payload: { geocode: string, wrapName: string }) { }
}

export class PopupNewGeoAdd implements Action {
  readonly type = PopupActionTypes.PopupNewGeoAdd;
  constructor(public payload: { geocode: string, availsInfo: AvailabilityDetailResponse[], wrapName: string }) { }
}

export type PopupActions = PopupGeoToggle | PopupNewGeoAdd;
