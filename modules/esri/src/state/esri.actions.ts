import { EntityState } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { DeepOmit, DeepPartial } from '@val/common';
import { EsriState } from './esri.reducers';

export interface InitialEsriState extends DeepPartial<DeepOmit<EsriState, EntityState<any>, 'ids' | 'entities'>> {
}

export const loadInitialState = createAction(
  '[Esri] Load Initial State',
  props<InitialEsriState>()
);
