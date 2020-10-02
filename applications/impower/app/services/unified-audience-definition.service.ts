import { Injectable } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map, take } from 'rxjs/operators';
import { OfflineAudienceResponse } from '../impower-datastore/state/transient/audience-definitions/audience-definitions.model';
import * as fromInMarketActions from '../impower-datastore/state/transient/audience-definitions/in-market/in-market-audience.actions';
import * as fromInMarket from '../impower-datastore/state/transient/audience-definitions/in-market/in-market-audience.reducer';
import * as fromInterestActions from '../impower-datastore/state/transient/audience-definitions/interest/interest-audience.actions';
import * as fromInterest from '../impower-datastore/state/transient/audience-definitions/interest/interest-audience.reducer';
import * as fromPixelActions from '../impower-datastore/state/transient/audience-definitions/pixel/pixel-audience.actions';
import * as fromPixel from '../impower-datastore/state/transient/audience-definitions/pixel/pixel-audience.reducer';
import * as fromTdaActions from '../impower-datastore/state/transient/audience-definitions/tda/tda-audience.actions';
import * as fromTda from '../impower-datastore/state/transient/audience-definitions/tda/tda-audience.reducer';
import * as fromVlhActions from '../impower-datastore/state/transient/audience-definitions/vlh/vlh-audience.actions';
import * as fromVlh from '../impower-datastore/state/transient/audience-definitions/vlh/vlh-audience.reducer';
import { OfflineAudienceDefinition, OnlineAudienceDescription } from '../models/audience-categories.model';
import { FullAppState } from '../state/app.interfaces';

@Injectable({
  providedIn: 'root'
})
export class UnifiedAudienceDefinitionService {

  private onlineFetchNeeded: boolean = true;
  private vlhFetchNeeded: boolean = true;
  private pixelFetchNeeded: boolean = true;
  private tdaFetchNeeded: boolean = true;

  constructor(private store$: Store<FullAppState>) { }

  public getInMarketDefinitions() : Observable<OnlineAudienceDescription[]> {
    if (this.onlineFetchNeeded) {
      this.store$.dispatch(fromInterestActions.fetchAudienceDefinitions());
      this.store$.dispatch(fromInMarketActions.fetchAudienceDefinitions());
      this.onlineFetchNeeded = false;
    }
    return this.store$.select(fromInMarket.allDefinitions).pipe(
      map(definitions => definitions.filter(d => d != null)),
      map(definitions => (new OnlineAudienceDescription(definitions)).children)
    );
  }

  public getInterestDefinitions() : Observable<OnlineAudienceDescription[]> {
    if (this.onlineFetchNeeded) {
      this.store$.dispatch(fromInterestActions.fetchAudienceDefinitions());
      this.store$.dispatch(fromInMarketActions.fetchAudienceDefinitions());
      this.onlineFetchNeeded = false;
    }
    return this.store$.select(fromInterest.allDefinitions).pipe(
      map(definitions => definitions.filter(d => d != null)),
      map(definitions => (new OnlineAudienceDescription(definitions)).children)
    );
  }

  public getVlhDefinitions() : Observable<OnlineAudienceDescription[]> {
    if (this.vlhFetchNeeded) {
      this.store$.dispatch(fromVlhActions.fetchAudienceDefinitions());
      this.vlhFetchNeeded = false;
    }
    return this.store$.select(fromVlh.allDefinitions).pipe(
      map(defs => defs.filter(d => d != null)),
      map(defs => (new OnlineAudienceDescription(defs)).children),
      map(defs => defs.filter(f => f.isLeaf && !f.categoryName.match('-canada$') && !f.categoryName.match('-uk$') && !f.categoryName.match('_canada$') && !f.categoryName.match('_uk$'))),
    );
  }

  public getPixelDefinitions() : Observable<OnlineAudienceDescription[]> {
    if (this.pixelFetchNeeded) {
      this.store$.dispatch(fromPixelActions.fetchAudienceDefinitions());
      this.pixelFetchNeeded = false;
    }
    return this.store$.select(fromPixel.allDefinitions).pipe(
      map(definitions => definitions.filter(d => d != null)),
      map(definitions => (new OnlineAudienceDescription(definitions)).children)
    );
  }

  public getTdaDefinitions() : Observable<OfflineAudienceDefinition[]> {
    if (this.tdaFetchNeeded) {
      this.store$.dispatch(fromTdaActions.fetchAudienceDefinitions());
      this.tdaFetchNeeded = false;
    }
    return this.store$.select(fromTda.allDefinitions).pipe(
      map(definitions => definitions.filter(d => d != null)),
      map(definitions => {
        const root: OfflineAudienceDefinition[] = [];
        const children: Record<string, OfflineAudienceDefinition[]> = {};
        definitions.forEach(def => {
          const currentEntity = new OfflineAudienceDefinition(def);
          if (currentEntity.children != null) {
            root.push(currentEntity);
          } else {
            if (children[currentEntity.parentName] == null) children[currentEntity.parentName] = [];
            children[currentEntity.parentName].push(currentEntity);
          }
        });
        root.forEach(r => {
          r.children = children[r.identifier] || [];
        });
        return root;
      })
    );
  }

  public getRawTdaDefinition(varPk: string) : Observable<OfflineAudienceResponse>;
  public getRawTdaDefinition(varPk: string[]) : Observable<OfflineAudienceResponse[]>;
  public getRawTdaDefinition(varPk: string | string[]) : Observable<OfflineAudienceResponse> | Observable<OfflineAudienceResponse[]> {
    return this.store$.select(fromTda.rawDefinitionByPk, { pk: varPk }).pipe(
      take(1)
    );
  }
}
