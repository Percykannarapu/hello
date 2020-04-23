import { Update } from '@ngrx/entity';
import { createAction, props } from '@ngrx/store';
import { BoundaryConfiguration } from '../../models/boundary-configuration';

export const loadBoundaries = createAction(
  '[Boundary/API] Load Boundaries',
  props<{ boundaries: BoundaryConfiguration[] }>()
);

export const addBoundary = createAction(
  '[Boundary/API] Add Boundary',
  props<{ boundary: BoundaryConfiguration }>()
);

export const upsertBoundary = createAction(
  '[Boundary/API] Upsert Boundary',
  props<{ boundary: BoundaryConfiguration }>()
);

export const addBoundaries = createAction(
  '[Boundary/API] Add Boundaries',
  props<{ boundaries: BoundaryConfiguration[] }>()
);

export const upsertBoundaries = createAction(
  '[Boundary/API] Upsert Boundaries',
  props<{ boundaries: BoundaryConfiguration[] }>()
);

export const updateBoundary = createAction(
  '[Boundary/API] Update Boundary',
  props<{ boundary: Update<BoundaryConfiguration> }>()
);

export const updateBoundaries = createAction(
  '[Boundary/API] Update Boundaries',
  props<{ boundaries: Update<BoundaryConfiguration>[] }>()
);

export const deleteBoundary = createAction(
  '[Boundary/API] Delete Boundary',
  props<{ id: string }>()
);

export const deleteBoundaries = createAction(
  '[Boundary/API] Delete Boundaries',
  props<{ ids: string[] }>()
);

export const clearBoundaries = createAction(
  '[Boundary/API] Clear Boundaries'
);
