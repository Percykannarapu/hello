import { isEmpty, isNil, mapArrayToEntity } from '@val/common';
import Dexie from 'dexie';
import { BehaviorSubject, EMPTY, from, Observable } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { fetchGet } from '../../common/fetch-helpers';
import { fixupOnline, OnlineAudienceDefinition, RestResponse } from '../../data-model/custom/treeview';
import { timestampIsExpired } from './utils';

function fixupBrokenLineage(audience: OnlineAudienceDefinition) : OnlineAudienceDefinition {
  // this method is for fixing broken taxonomy hierarchies. I'll leave the "broken" version in categoryDescr
  // Food & Drink
  if (audience.categoryId === 1093 && (audience.digCategoryId === 30890 || audience.digCategoryId === 32234)) {
    audience.taxonomy = audience.categoryName;
  }
  // Winter Sports Equipment
  if (audience.categoryId === 631 && (audience.digCategoryId === 33048 || audience.digCategoryId === 31704)) {
    audience.taxonomy = `Sports/Sporting Goods/${audience.categoryName}`;
  }
  return audience;
}

let fakeAncestorId = -100;

function fixupNestedData(audiences: OnlineAudienceDefinition[]) : OnlineAudienceDefinition[] {
  const usableAudiences = audiences.map(a => fixupBrokenLineage(a));
  const familyAlbum = mapArrayToEntity(usableAudiences, a => a.taxonomy);
  const addedAudiences: OnlineAudienceDefinition[] = [];
  usableAudiences.forEach(audience => {
    addedAudiences.push(...mutateAudienceWithAncestorData(audience, familyAlbum));
  });
  addedAudiences.forEach(audience => mutateAudienceWithAncestorData(audience, familyAlbum));
  return usableAudiences.concat(addedAudiences);
}

function mutateAudienceWithAncestorData(audience: OnlineAudienceDefinition, familyAlbum: { [p: string] : OnlineAudienceDefinition }) : OnlineAudienceDefinition[] {
  const result = [];
  const ancestors = audience.taxonomy.split('/').reduce((a, c) => {
    if (isEmpty(c) || c === audience.categoryName) return a;
    const lastIndex = a.length - 1;
    let newValue = c;
    if (lastIndex >= 0) {
      newValue = [a[lastIndex], c].join('/');
    }
    a.push(newValue);
    return a;
  }, [] as string[]);
  audience.familyIds = ancestors.reduce((a, c, i, orig) => {
    const currentAncestor = familyAlbum[c];
    if (!isEmpty(currentAncestor)) {
      currentAncestor.hasChildren = true;
      a.push(currentAncestor.digCategoryId);
      if (i === orig.length - 1) {
        audience.parentId = currentAncestor.digCategoryId;
      }
    } else {
      // ancestor is missing - we should synthesize a fake one
      const currentAncestorId = fakeAncestorId--;
      const fake: Partial<OnlineAudienceDefinition> = {
        digCategoryId: currentAncestorId,
        categoryId: currentAncestorId,
        categoryDescr: c,
        taxonomy: c,
        categoryName: null, //temp
        source: 'fake',
        isActive: 1,
      };
      const taxonomyParts = fake.taxonomy.split('/').filter(t => !isEmpty(t));
      if (!isEmpty(taxonomyParts)) {
        fake.categoryName = taxonomyParts[taxonomyParts.length - 1];
        const fixed = fixupOnline(fake);
        familyAlbum[c] = fixed;
        fixed.hasChildren = true;
        a.push(fixed.digCategoryId);
        if (i === orig.length - 1) {
          audience.parentId = fixed.digCategoryId;
        }
        result.push(fixed);
      }
    }
    return a;
  }, [] as number[]);
  return result;
}

export class OnlineQuery {
  private readonly refresh: Dexie.Table<{ id?: number, timestamp: number }, number>;
  private readonly audiences: Dexie.Table<OnlineAudienceDefinition, number>;

  public currentTimeStamp: number;
  public ready$ = new BehaviorSubject(false);

  constructor(private schema: Dexie,
              private resourceUrl: string,
              private isNestedAudience: boolean,
              private leafFilter?: (a: OnlineAudienceDefinition) => boolean) {
    this.refresh = this.schema.table('refresh');
    this.audiences = this.schema.table('audiences');
  }

  initialize(forceRefresh: boolean, fetchHeaders: { Authorization: string }) : Observable<void> {
    const refresh$ = from(this.refresh.toCollection().first());
    const getAudiences$ = fetchGet<RestResponse<OnlineAudienceDefinition>>(this.resourceUrl, fetchHeaders).pipe(
      map(response => response.payload.rows.map(row => fixupOnline(row))),
      map(audiences => this.isNestedAudience ? fixupNestedData(audiences) : audiences),
      map(audiences => isNil(this.leafFilter) ? audiences : audiences.filter(this.leafFilter)),
      switchMap(audiences => from(this.refreshDatabase(audiences)))
    );
    return refresh$.pipe(
      tap(refresh => this.currentTimeStamp = refresh?.timestamp),
      switchMap(refresh => {
        if (forceRefresh || timestampIsExpired(refresh?.timestamp, 12)) {
          this.ready$.next(false);
          return getAudiences$;
        } else {
          this.ready$.next(true);
          return EMPTY;
        }
      })
    );
  }

  private async refreshDatabase(audiences: OnlineAudienceDefinition[]) : Promise<void> {
    await this.audiences.clear();
    await this.audiences.bulkAdd(audiences).catch(Dexie.BulkError, (e) => console.error(e));
    await this.refresh.clear();
    const now = Date.now();
    this.currentTimeStamp = now;
    this.ready$.next(true);
    await this.refresh.add({ timestamp: now });
  }

  getAudiencesByFamily(familyIds: number[]) : Promise<OnlineAudienceDefinition[]> {
    return this.audiences.where('digCategoryId').anyOf(familyIds).toArray();
  }

  getAudiencesByParentId(parentId: number) : Promise<OnlineAudienceDefinition[]> {
    return this.audiences.where('parentId').equals(parentId ?? -1).toArray();
  }

  searchAudiences(searchTerm: string, includeFolder: boolean, parentId: number) : Promise<OnlineAudienceDefinition[]> {
    const coreTagSearch = this.audiences.where('searchTags').startsWith(searchTerm.toLowerCase());
    let finalSearch = coreTagSearch;
    if (includeFolder) {
      finalSearch = coreTagSearch.or('folderSearchTags').startsWith(searchTerm.toLowerCase());
    }
    if (isNil(parentId)) {
      return finalSearch.toArray();
    } else {
      return finalSearch.filter(x => x.familyIds.some(id => id === parentId)).toArray();
    }
  }
}
