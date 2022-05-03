import { createSelector } from '@ngrx/store';
import { isStringArray } from '@val/common';
import { OnlineSourceTypes } from '../../../../common/models/audience-enums';
import { transientSlice } from '../../impower-datastore.selectors';
import * as fromAudience from '../audience/audience.reducer';
import { Audience } from './audience.model';

export const audienceSlice = createSelector(transientSlice, state => state.audiences);
export const allAudiences = createSelector(audienceSlice, fromAudience.selectAll);
export const allAudienceEntities = createSelector(audienceSlice, fromAudience.selectEntities);

export const fetchableAudiences = createSelector(allAudiences, (audiences) => audiences.filter(audience => audience.audienceSourceType !== 'Custom'));
export const customAudiences = createSelector(allAudiences, (audiences) => audiences.filter(audience => audience.audienceSourceType === 'Custom'));

export const getAudiencesInFootprint = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.exportInGeoFootprint));
export const getFetchableAudiencesInFootprint = createSelector(fetchableAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.exportInGeoFootprint));
export const getCustomAudiencesInFootprint = createSelector(customAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.exportInGeoFootprint));
export const getAudiencesInGrid = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.showOnGrid));
export const getFetchableAudiencesInGrid = createSelector(fetchableAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.showOnGrid));
export const getCustomAudiencesInGrid = createSelector(customAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.showOnGrid));
export const getAudiencesInExtract = createSelector(allAudiences, (audiences: Audience[]) => audiences.filter(audience => audience.exportNationally));

const allDigitalAudiences = createSelector(allAudiences, (audiences) => audiences.filter(a => a.audienceSourceType === 'Online'));
export const getInterestAudiences = createSelector(allDigitalAudiences, (audiences) => audiences.filter(a => a.audienceSourceName === OnlineSourceTypes.Interest));
export const getInMarketAudiences = createSelector(allDigitalAudiences, (audiences) => audiences.filter(a => a.audienceSourceName === OnlineSourceTypes.InMarket));
export const getInterestAndMarketAudiences = createSelector(allDigitalAudiences, audiences => audiences.filter(a => a.audienceSourceName === OnlineSourceTypes.InMarket || a.audienceSourceName === OnlineSourceTypes.Interest));
export const getVlhAudiences = createSelector(allDigitalAudiences, (audiences) => audiences.filter(a => a.audienceSourceName === OnlineSourceTypes.VLH));
export const getPixelAudiences = createSelector(allDigitalAudiences, (audiences) => audiences.filter(a => a.audienceSourceName === OnlineSourceTypes.Pixel));
export const getTdaAudiences = createSelector(allAudiences, (audiences) => audiences.filter(a => a.audienceSourceType === 'Offline'));

const createdSources = new Set(['Combined', 'Converted', 'Combined/Converted', 'Composite']);
export const getCreatedAudiences = createSelector(allAudiences, (audiences) => audiences.filter(a => createdSources.has(a.audienceSourceType)));
export const getReservedIds = createSelector(getCreatedAudiences, audiences => new Set(audiences.flatMap(a => {
  if (isStringArray(a.compositeSource))
    return a.compositeSource.map(cs => Number(cs));
  else if (isStringArray(a.combinedAudiences))
    return a.combinedAudiences.map(vars => Number(vars));
  else
    return a.compositeSource.map(cs => Number(cs.id));
})));
const preAssignedPks = new Set(['Online', 'Offline']);
const assignedPkAudiences = createSelector(allAudiences, audiences => audiences.filter(a => !preAssignedPks.has(a.audienceSourceType)));
export const getMaxAssignedPk = createSelector(assignedPkAudiences, audiences => audiences.reduce((p, c) => Math.max(p, Number(c.audienceIdentifier)), 0));
export const getMaxSortOrder = createSelector(allAudiences, audiences => audiences.reduce((p, c) => Math.max(p, c.sortOrder), -1));
