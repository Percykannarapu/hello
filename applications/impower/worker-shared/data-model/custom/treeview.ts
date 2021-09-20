import { isConvertibleToInteger, isEmpty } from '@val/common';
import { TreeNode } from 'primeng/api';
import { FieldContentTypeCodes } from '../impower.data-model.enums';

export interface ValassisTreeNode<T = any> extends TreeNode<T> {
  escaped?: boolean;
  isReserved?: boolean;
}

export interface OfflineCategoryResponse {
  '@ref': number;
  pk: number;
  tablename: string;
  tabledesc: string;
  sort: number;
  accessType: string;
}

export interface OfflineAudienceResponse {
  '@ref': number;
  tablename: string;
  fieldnum: string;
  fieldname: string;
  fielddescr: string;
  fieldtype: string;
  fieldconte: FieldContentTypeCodes;
  decimals: string;
  source: string;
  userAccess: string;
  varFormat: string;
  natlAvg: string;
  avgType: string;
  pk: number;
  includeInCb: string;
  includeInDatadist: string;
  searchTags: string[];
  folderSearchTags: string[];
  parentPk: number;
}

export interface OnlineAudienceDefinition {
  digCategoryId: number;
  categoryId: number;
  source: string;
  categoryName: string;
  categoryDescr: string;
  taxonomy: string;
  isActive: 0 | 1;
  parentId: number;
  searchTags: string[];
  folderSearchTags: string[];
  familyIds: number[];
  hasChildren: boolean;
}

export function fixupOffline(category: OfflineCategoryResponse, audience: OfflineAudienceResponse) : OfflineAudienceResponse {
  const parent = fixupPk(category);
  const result = fixupPk(audience);
  result.fieldconte = FieldContentTypeCodes.parse(audience.fieldconte);
  result.searchTags = createTagArray(result.fielddescr, /[\s]+/);
  result.searchTags.push(result.fieldname);
  result.folderSearchTags = createTagArray(parent.tabledesc, /[\s\/]+/);
  result.parentPk = parent.pk;
  return result;
}

function fixupPk<T extends { pk: number }>(response: T) : T {
  if (isConvertibleToInteger(response.pk)) {
    return {
      ...response,
      pk: Number(response.pk)
    };
  } else {
    return response;
  }
}

export function fixupOnline(audience: Partial<OnlineAudienceDefinition>) : OnlineAudienceDefinition {
  const result = fixupIds(audience);
  result.searchTags = createTagArray(result.categoryName, /[\s\/~]+/);
  result.folderSearchTags = createTagArray(result.taxonomy.replace(result.categoryName, ''), /[\s\/]+/);
  // set everyone to root level - the audience init code will deal with nested data later
  result.parentId = -1;
  result.familyIds = [];
  result.hasChildren = false;
  return result as any;
}

function fixupIds(audience: Partial<OnlineAudienceDefinition>) : Partial<OnlineAudienceDefinition> {
  if (isConvertibleToInteger(audience.digCategoryId)) {
    return {
      ...audience,
      digCategoryId: Number(audience.digCategoryId),
      categoryId: isConvertibleToInteger(audience.categoryId) ? Number(audience.categoryId) : audience.categoryId
    };
  } else {
    return audience;
  }
}

function createTagArray(value: string, splitter: RegExp) : string[] {
  const containsLetters = /[a-z]/;
  const rawTags = value.split(splitter);
  const validTags = rawTags.reduce((a, c) => {
    if (!isEmpty(c) && c.length > 1) {
      a.push(c.toLowerCase());
      let sub = c.toLowerCase().slice(1);
      while (sub.length > 2 && containsLetters.test(sub)) {
        a.push(sub);
        sub = sub.slice(1);
      }
    }
    return a;
  }, [] as string[]);
  validTags.push(value.toLowerCase());
  let currentTags = Array.from(rawTags);
  while (currentTags.length > 1) {
    validTags.push(currentTags.join(' ').toLowerCase());
    currentTags = currentTags.slice(1);
  }
  const dedupedTags = new Set(validTags);
  return Array.from(dedupedTags);
}
