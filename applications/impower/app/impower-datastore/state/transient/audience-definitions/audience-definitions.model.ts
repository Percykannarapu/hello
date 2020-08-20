export interface OnlineAudienceDefinition {
  digCategoryId: number;
  categoryId: number;
  source: string;
  categoryName: string;
  categoryDescr: string;
  taxonomy: string;
  isActive: 0 | 1;
}

export interface OfflineCategoryResponse {
  '@ref': number;
  pk: number;
  tablename: string;
  tabledesc: string;
  sort: number;
  accessType: string;
  id: string;
}

export interface OfflineAudienceResponse {
  '@ref': number;
  tablename: string;
  fieldnum: string;
  fieldname: string;
  fielddescr: string;
  fieldtype: string;
  fieldconte: string;
  decimals: string;
  source: string;
  userAccess: string;
  varFormat: string;
  natlAvg: string;
  avgType: string;
  pk: string;
  includeInCb: string;
  includeInDatadist: string;
  id: string;
}

export type OfflineResponse = OfflineCategoryResponse | OfflineAudienceResponse;

export function fixupEntityId(response: OfflineResponse) {
  if (isOfflineCategory(response)) {
    response.id = response.tablename;
  } else {
    response.id = response.pk;
  }
}

export function isOfflineCategory(r: any) : r is OfflineCategoryResponse {
  return r.hasOwnProperty('tablename') && r.hasOwnProperty('tabledesc') && r.hasOwnProperty('sort');
}
