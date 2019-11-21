import { createAction, props } from '@ngrx/store';
import { DeepPartial } from '@val/common';
import { EsriState } from './esri.selectors';

export interface InitialEsriState extends DeepPartial<EsriState> {
}

export const loadInitialState = createAction(
  '[Esri] Load Initial State',
  props<InitialEsriState>()
);
