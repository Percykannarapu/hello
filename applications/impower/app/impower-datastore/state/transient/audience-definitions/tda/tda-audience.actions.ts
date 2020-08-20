import { createAction, props } from '@ngrx/store';
import { OfflineAudienceResponse, OfflineCategoryResponse } from '../audience-definitions.model';

export const actionFamily = 'TDA';

export const fetchAudienceDefinitions = createAction(
  `[${actionFamily}Audience/API] Fetch ${actionFamily}Audience Definitions`
);

export const loadAudienceCategories = createAction(
  `[${actionFamily}Audience/API] Load ${actionFamily}Audience Categories`,
  props<{ categories: OfflineCategoryResponse[] }>()
);

export const loadAudienceDefinitions = createAction(
  `[${actionFamily}Audience/API] Load ${actionFamily}Audience Definitions`,
  props<{ definitions: OfflineAudienceResponse[] }>()
);

export const clearAudienceDefinitions = createAction(
  `[${actionFamily}Audience/API] Clear ${actionFamily}Audience Definitions`
);
