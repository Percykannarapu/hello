import { isNil } from '@val/common';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { AudienceDataDefinition } from './models/audience-data.model';

export function isAudience(a: AudienceDataDefinition) : a is Audience {
  return !isNil(a.audienceIdentifier) && !isNil(a.sortOrder);
}
