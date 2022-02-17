import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { isConvertibleToNumber, isEmpty, isNil, mapByExtended } from '@val/common';
import { EsriGeographyPopupComponent, PopupDefinition, PopupTreeNodeData } from '@val/esri';
import { TreeNode } from 'primeng/api';
import { of, Subscription } from 'rxjs';
import { catchError, map, switchMap, tap } from 'rxjs/operators';
import { OfflineAudienceResponse } from '../../worker-shared/data-model/custom/treeview';
import { FieldContentTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { OfflineQuery } from '../../worker-shared/treeview-workers/dexie/offline-query';
import { AppConfig } from '../app.config';
import { createOfflineAudienceInstance } from '../common/models/audience-factories';
import { isAudience } from '../common/valassis-types';
import { AudienceFetchService } from '../impower-datastore/services/audience-fetch.service';
import { Audience } from '../impower-datastore/state/transient/audience/audience.model';
import { fetchableAudiences } from '../impower-datastore/state/transient/audience/audience.selectors';
import { DynamicVariable } from '../impower-datastore/state/transient/dynamic-variable.model';
import { FullAppState } from '../state/app.interfaces';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ValMetricsService } from './app-metrics.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class AppComponentGeneratorService {

  private readonly fullyRoundedContentTypes = new Set<FieldContentTypeCodes>([
    FieldContentTypeCodes.Char,
    FieldContentTypeCodes.Count,
    FieldContentTypeCodes.Dist,
    FieldContentTypeCodes.Distance,
    FieldContentTypeCodes.Index
  ]);

  private cachedGeoPopup: Map<string, ComponentRef<EsriGeographyPopupComponent>> =  new Map<string, ComponentRef<EsriGeographyPopupComponent>>();
  private cachedEventSubs: Map<string, Subscription> = new Map<string, Subscription>();
  private cachedAudienceSubs: Map<string, Subscription> = new Map<string, Subscription>();
  private nodeOpenState: Map<string, any> = new Map<string, any>();

  constructor(private config: AppConfig,
              private appStateService: AppStateService,
              private audienceService: AudienceFetchService,
              private resolver: ComponentFactoryResolver,
              private injector: Injector,
              private logger: LoggingService,
              private store$: Store<FullAppState>,
              private valMetricsService: ValMetricsService) {
    // this.appStateService.refreshDynamicContent$.subscribe(() => this.updateDynamicComponents());
  }

  public geographyPopupFactory(feature: __esri.Feature, layerId: string, popupDefinition: PopupDefinition) : HTMLElement {
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    const analysisLayer = isEmpty(analysisLevel) ? null : this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const requestedGeocode = feature.graphic.attributes.geocode;
    this.logger.debug.log(`Building popup for geocode ${requestedGeocode} for layer id ${layerId}`);
    const cacheKey = requestedGeocode + layerId;
    if (!this.cachedGeoPopup.has(cacheKey)) {
      const popup = this.createGeographyPopup(cacheKey, layerId);
      popup.instance.loadingPrimaryData = true;
      popup.instance.geocode = requestedGeocode;
      popup.instance.nodeExpandState = this.nodeOpenState.get(layerId) ?? {};
      this.setupPopupData(requestedGeocode, layerId, popupDefinition, popup);
      if (layerId === analysisLayer) {
        this.setupPopupAudienceData(requestedGeocode, analysisLevel, cacheKey, popup);
      } else {
        popup.instance.audienceTreeNodes = [];
        setTimeout(() => popup.changeDetectorRef.detectChanges());
      }
    }
    if (this.cachedGeoPopup.get(cacheKey) != null && this.cachedGeoPopup.get(cacheKey).location != null) {
      return this.cachedGeoPopup.get(cacheKey).location.nativeElement;
    }
  }

  public cleanUpGeoPopup() : void {
    this.logger.debug.log('Destroying popup instance');
    if (this.cachedGeoPopup.size > 0) {
      this.cachedGeoPopup.forEach((g, key) => {
        if (this.cachedEventSubs.has(key)) {
          this.cachedEventSubs.get(key)?.unsubscribe();
          this.cachedEventSubs.delete(key);
        }
        if (this.cachedAudienceSubs.has(key)) {
          this.cachedAudienceSubs.get(key)?.unsubscribe();
          this.cachedAudienceSubs.delete(key);
        }
        if (g != null)  g.destroy();
      });
    }
    this.nodeOpenState.clear();
    this.cachedGeoPopup.clear();
  }

  private createGeographyPopup(cacheKey: string, layerId: string) : ComponentRef<EsriGeographyPopupComponent> {
    const factory = this.resolver.resolveComponentFactory(EsriGeographyPopupComponent);
    this.logger.debug.log('Instantiating new popup component');
    const result = factory.create(this.injector);
    this.cachedGeoPopup.set(cacheKey , result);
    const newListener = result.instance.needsRefresh.subscribe((state) => {
      this.nodeOpenState.set(layerId, state);
      setTimeout(() => result.changeDetectorRef.detectChanges());
    });
    this.cachedEventSubs.set(cacheKey, newListener);
    return result;
  }

  private setupPopupData(geocode: string, layerId: string, popupDefinition: PopupDefinition, component: ComponentRef<EsriGeographyPopupComponent>) : void {
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    const analysisLayer = isEmpty(analysisLevel) ? null : this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const layerLevel = this.config.layerIdToAnalysisLevel(layerId);
    if (!isNil(layerLevel)) {
      const allPks = popupDefinition.customPopupPks.concat(popupDefinition.customSecondaryPopupPks).concat(30534); // including cov_frequency for Investment calc
      const dbQuery = new OfflineQuery();
      let sortSeed = 0;
      dbQuery.retrieveAudiences(allPks).then(response => {
        response.sort((a, b) => allPks.findIndex(pk => pk === a.pk) - allPks.findIndex(pk => pk === b.pk));
        const audienceInstances = response.map(r => createOfflineAudienceInstance(r.fielddescr, `${r.pk}`, r.fieldconte, false, false, sortSeed++)).filter(isAudience);
        this.audienceService.getCachedAudienceData(audienceInstances, audienceInstances, layerLevel, [geocode], true).pipe(
          map(result => this.convertVarsForPopup(geocode, result, audienceInstances))
        ).subscribe(allNodes => {
          const rootIds = new Set(popupDefinition.customPopupPks);
          const rootNodes = allNodes.filter(n => rootIds.has(n.data.pk));
          if (popupDefinition.includeInvestment && layerId === analysisLayer) {
            const investmentNode = this.calcInvestment(allNodes, response, rootNodes.length);
            rootNodes.push(investmentNode);
          }
          component.instance.primaryTreeNodes = rootNodes;
          component.instance.secondaryTreeNodes = allNodes.filter(n => !rootIds.has(n.data.pk) && n.data.pk !== 30534); // removing cov_frequency, so it doesn't show up in the popup
          component.instance.loadingPrimaryData = false;
          component.instance.refreshTreeview();
          setTimeout(() => component.changeDetectorRef.detectChanges());
        });
      });
    }
  }

  private setupPopupAudienceData(geocode: string, analysisLevel: string, cacheKey: string, component: ComponentRef<EsriGeographyPopupComponent>) : void {
    const currentSub = this.store$.select(fetchableAudiences).pipe(
      tap(() => component.instance.loadingAudienceData = true),
      switchMap(aud => this.audienceService.getCachedAudienceData(aud, aud, analysisLevel, [geocode], true).pipe(
        catchError(() => of([] as DynamicVariable[])),
        map(varReturn => [varReturn, aud] as const)
      )),
      map(([data, aud]) => this.convertVarsForPopup(geocode, data, aud))
    ).subscribe(result => {
      component.instance.audienceTreeNodes = result;
      component.instance.loadingAudienceData = false;
      component.instance.refreshTreeview();
      setTimeout(() => component.changeDetectorRef.detectChanges());
    });
    if (this.cachedAudienceSubs.has(cacheKey)) this.cachedAudienceSubs.get(cacheKey)?.unsubscribe();
    this.cachedAudienceSubs.set(cacheKey, currentSub);
  }

  private calcInvestment(nodes: TreeNode<PopupTreeNodeData>[], metaData: OfflineAudienceResponse[], sortOrder: number) : TreeNode<PopupTreeNodeData> {
    const impProject: ImpProject = this.appStateService.currentProject$.getValue();
    const season = impProject.impGeofootprintMasters[0].methSeason?.toLocaleLowerCase();
    const metaMap = mapByExtended(metaData, n => n.fieldname.toLowerCase());
    const nodeMap = mapByExtended(nodes, n => n.data.pk);
    const hhcPk = metaMap.get(`hhld_${season}`)?.pk;
    const ogPk = metaMap.get('owner_group_primary')?.pk;
    const cfPk = metaMap.get('cov_frequency')?.pk;
    const hhc = isConvertibleToNumber(nodeMap.get(hhcPk).data.value) ? Number(nodeMap.get(hhcPk).data.value) : 0;
    const ownerGroupCpm = this.valMetricsService.getCpmForGeo(`${nodeMap.get(ogPk).data.value}`, `${nodeMap.get(cfPk).data.value}`);
    const result = isNil(impProject.estimatedBlendedCpm ?? ownerGroupCpm) ? null : (impProject.estimatedBlendedCpm ?? ownerGroupCpm) * hhc / 1000;
    return {
      leaf: true,
      data: {
        name: 'Investment',
        sortOrder,
        value: isNil(result) ? 'N/A' : result,
        isNumber: !isNil(result),
        numberFormat: 'currency',
        digitsInfo: `1.0-2`,
      }
    };
  }

  private convertVarsForPopup(currentGeocode: string, vars: DynamicVariable[], audiences: Audience[]) : TreeNode<PopupTreeNodeData>[] {
    const currentVar = vars.filter(v => v.geocode === currentGeocode)[0];
    if (isNil(currentVar) && !isEmpty(audiences)) return [{
      leaf: true,
      data: {
        name: 'Audience data unavailable',
        isMessageNode: true,
        sortOrder: 0
      }
    }];
    audiences.sort((a, b) => a.sortOrder - b.sortOrder);
    return audiences.map(a => {
      const isNumber = a.fieldconte !== FieldContentTypeCodes.Char;
      return {
        leaf: true,
        data: {
          name: a.audienceSourceType === 'Online' ? `${a.audienceName} (${a.audienceSourceName})` : a.audienceName,
          sortOrder: a.sortOrder,
          pk: isConvertibleToNumber(a.audienceIdentifier) ? Number(a.audienceIdentifier) : null,
          value: a.fieldconte === FieldContentTypeCodes.Percent ? (Number(currentVar[a.audienceIdentifier]) / 100) : currentVar[a.audienceIdentifier],
          isNumber,
          numberFormat: a.fieldconte === FieldContentTypeCodes.Percent
                        ? 'percent'
                        : 'none',
          digitsInfo: `1.0-${this.fullyRoundedContentTypes.has(a.fieldconte) ? 0 : 2}`,
        }
      };
    });
  }
}
