import { createAction, props } from '@ngrx/store';
import { OnlineAudienceDefinition } from '../audience-definitions.model';

export const actionFamily = 'Pixel';

export const fetchAudienceDefinitions = createAction(
  `[${actionFamily}Audience/API] Fetch ${actionFamily}Audience Definitions`
);

export const loadAudienceDefinitions = createAction(
  `[${actionFamily}Audience/API] Load ${actionFamily}Audience Definitions`,
  props<{ definitions: OnlineAudienceDefinition[] }>()
);

export const clearAudienceDefinitions = createAction(
  `[${actionFamily}Audience/API] Clear ${actionFamily}Audience Definitions`
);
