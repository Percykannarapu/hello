import { createAction, props } from '@ngrx/store';
import { AnalysisLevel } from '../common/models/ui-enums';

export const ChangeAnalysisLevel = createAction(
  '[Application] Change Analysis Level',
  props<{ analysisLevel: AnalysisLevel }>()
);
