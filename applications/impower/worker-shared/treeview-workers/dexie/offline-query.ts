import { isNil } from '@val/common';
import Dexie from 'dexie';
import { BehaviorSubject, EMPTY, from, merge, Observable } from 'rxjs';
import { filter, map, reduce, switchMap, tap } from 'rxjs/operators';
import { serverEnv } from '../../../environments/server-urls';
import { fetchGet } from '../../common/fetch-helpers';
import { fixupOffline, OfflineAudienceResponse, OfflineCategoryResponse, RestResponse } from '../../data-model/custom/treeview';
import { TDASchema } from './schemas';
import { timestampIsExpired } from './utils';

const categoryUrl = 'v1/targeting/base/amtabledesc/search?q=amtabledesc';
const audienceUrl = 'v1/targeting/base/cldesctab/search?q=cldesctab&includeInImp=1&tablename=';

export class OfflineQuery {

  private readonly schema: TDASchema;
  private readonly refresh: Dexie.Table<{ id?: number, timestamp: number }, number>;
  private readonly categories: Dexie.Table<OfflineCategoryResponse, number>;
  private readonly audiences: Dexie.Table<OfflineAudienceResponse, number>;

  private categoriesForRemoval = new Set<number>();

  public currentTimeStamp: number;
  public ready$ = new BehaviorSubject(false);

  constructor() {
    this.schema = new TDASchema();
    this.refresh = this.schema.table('refresh');
    this.categories = this.schema.table('categories');
    this.audiences = this.schema.table('audiences');
  }

  initialize(forceRefresh: boolean, fetchHeaders: { Authorization: string }) : Observable<void> {
    const refresh$ = from(this.refresh.toCollection().first());
    const categoryRefresh$ = fetchGet<RestResponse<OfflineCategoryResponse>>(serverEnv.middlewareBase + categoryUrl, fetchHeaders).pipe(
      map(response => response.payload.rows),
      tap(() => this.categoriesForRemoval.clear()),
      switchMap(categories => this.fetchAudiences(categories, fetchHeaders).pipe(
        switchMap(audiences => from(this.refreshDatabase(categories, audiences)))
      ))
    );
    return refresh$.pipe(
      tap(refresh => this.currentTimeStamp = refresh?.timestamp),
      switchMap(refresh => {
        if (forceRefresh || timestampIsExpired(refresh?.timestamp, 12)) {
          this.ready$.next(false);
          return categoryRefresh$;
        } else {
          this.ready$.next(true);
          return EMPTY;
        }
      })
    );
  }

  getAllCategories() : Promise<OfflineCategoryResponse[]> {
    return this.categories.toCollection().sortBy('sort');
  }

  filterCategories(categoryPks: number[]) : Promise<OfflineCategoryResponse[]> {
    return this.categories.where('pk').anyOf(categoryPks).sortBy('sort');
  }

  filterAudiencesByCategory(categoryPk: number) : Promise<OfflineAudienceResponse[]> {
    return this.audiences.where('parentPk').equals(categoryPk).toArray();
  }

  searchAudiences(searchTerm: string, includeFolder: boolean, categoryPk: number) : Promise<OfflineAudienceResponse[]> {
    const coreTagSearch = this.audiences.where('searchTags').startsWith(searchTerm.toLowerCase());
    let finalSearch;
    if (includeFolder) {
      finalSearch = coreTagSearch.or('folderSearchTags').startsWith(searchTerm.toLowerCase());
    } else {
      finalSearch = coreTagSearch;
    }
    if (isNil(categoryPk)) {
      return finalSearch.toArray();
    } else {
      return finalSearch.filter(x => x.parentPk === categoryPk).toArray();
    }
  }

  private fetchAudiences(categories: OfflineCategoryResponse[], fetchHeaders: { Authorization: string }) : Observable<OfflineAudienceResponse[]> {
    const audienceRequests$ = categories.map(category => fetchGet<RestResponse<OfflineAudienceResponse>>(`${serverEnv.middlewareBase + audienceUrl}${category.tablename}`, fetchHeaders).pipe(
      map(response => response.payload.rows.map(row => fixupOffline(category, row))),
      tap(rows => rows.length === 0 ? this.categoriesForRemoval.add(category.pk) : null)
    ));
    return merge(...audienceRequests$, 4).pipe(
      filter(audiences => audiences.length > 0),
      reduce((acc, result) => acc.concat(result), [] as OfflineAudienceResponse[])
    );
  }

  private async refreshDatabase(categories: OfflineCategoryResponse[], audiences: OfflineAudienceResponse[]) : Promise<void> {
    await this.categories.clear();
    await this.categories.bulkAdd(categories.filter(c => !this.categoriesForRemoval.has(c.pk))).catch(Dexie.BulkError, (e) => console.error(e));
    await this.audiences.clear();
    await this.audiences.bulkAdd(audiences).catch(Dexie.BulkError, (e) => console.error(e));
    await this.refresh.clear();
    const now = Date.now();
    this.currentTimeStamp = now;
    this.ready$.next(true);
    await this.refresh.add({ timestamp: now });
  }
}
