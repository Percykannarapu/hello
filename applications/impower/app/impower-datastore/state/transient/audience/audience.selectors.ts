import { createSelector } from '@ngrx/store';
import { transientSlice } from '../../impower-datastore.selectors';
import { Audience } from './audience.model';
import * as fromAudience from '../audience/audience.reducer';

export const audienceSlice = createSelector(transientSlice, state => state.audiences);
export const allAudiences = createSelector(audienceSlice, fromAudience.selectAll);
export const allAudienceEntities = createSelector(audienceSlice, fromAudience.selectEntities);

export const getAudiencesInFootprint = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.exportInGeoFootprint));
export const getAudiencesInGrid = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.showOnGrid));
export const getAudiencesOnMap = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.showOnMap));
export const getAudiencesNationalExtract = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.exportNationally));
export const getAudiencesAppliable = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.showOnGrid || audience.exportInGeoFootprint));

export const selectAudienceIds = createSelector(audienceSlice, fromAudience.selectIds);
export const selectAudienceEntities = createSelector(audienceSlice, fromAudience.selectEntities);
export const selectAudiences = createSelector(audienceSlice, fromAudience.selectAll);

export const getOutstandingVarFetches = createSelector(audienceSlice, state => state.scratch.outstandingVarFetches);
export const getApplyAudiencesStart = createSelector(audienceSlice, state => state.scratch.applyAudiencesStart);

export const getAllAudiences = createSelector(allAudienceEntities, entities => {
  return Object.keys(entities).map(id => entities[id]);
});
