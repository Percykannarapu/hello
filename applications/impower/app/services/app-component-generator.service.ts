import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { isNil } from '@val/common';
import { EsriGeographyPopupComponent, NodeVariable, PopupDefinition } from '@val/esri';
import { of, Subscription } from 'rxjs';
import { catchError, map, switchMap } from 'rxjs/operators';
import { FieldContentTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
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

  public geographyPopupFactory(feature: __esri.Feature, fields: __esri.FieldInfo[], layerId: string, popupDefinition: PopupDefinition) : HTMLElement {
    const requestedGeocode = feature.graphic.attributes.geocode;
    this.logger.debug.log(`Building popup for geocode ${requestedGeocode} for layer id ${layerId}`);
    const cacheKey = requestedGeocode + layerId;
    if (!this.cachedGeoPopup.has(cacheKey)) {
      const popup = this.createGeographyPopup(cacheKey, layerId);
      this.populateGeographyPopupData(requestedGeocode, feature, fields, popupDefinition, cacheKey, layerId, popup);
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

  private populateGeographyPopupData(geocode: string, feature: __esri.Feature, fields: __esri.FieldInfo[],
                                     popupDefinition: PopupDefinition, cacheKey: string, layerId: string,
                                     component: ComponentRef<EsriGeographyPopupComponent>) : void {

    this.logger.debug.log('Setting popup values', geocode, feature.graphic.attributes, fields, popupDefinition);
    const analysisLevel = this.appStateService.analysisLevel$.getValue();
    const analysisLayer = this.config.getLayerIdForAnalysisLevel(analysisLevel);
    const invest = this.calcInvestment(feature.graphic.attributes);
    feature.graphic.setAttribute('Investment', invest);

    const fieldNames = fields.map(f => f.fieldName);
    if (!fieldNames.includes('Investment')) {
      const attr = {} as  __esri.FieldInfo;
      attr.fieldName = 'Investment';
      attr.label = 'Investment';
      fields.push(attr);
    }

    component.instance.geocode = geocode;
    component.instance.attributes = feature.graphic.attributes;
    component.instance.attributeFields = fields;
    component.instance.customPopupDefinition = popupDefinition;
    component.instance.nodeExpandState = this.nodeOpenState.get(layerId) ?? {};
    if (analysisLayer === layerId) {
      const currentSub = this.store$.select(fetchableAudiences).pipe(
        switchMap(aud => this.audienceService.getCachedAudienceData(aud, aud, analysisLevel, [geocode], true).pipe(
          catchError(() => of([] as DynamicVariable[])),
          map(varReturn => [varReturn, aud] as const)
        )),
        map(([data, aud]) => this.convertVarsForPopup(geocode, data, aud))
      ).subscribe(result => {
        component.instance.selectedVars = result;
        if (this.cachedGeoPopup.has(cacheKey)) component.instance.refreshTreeview();
        setTimeout(() => component.changeDetectorRef.detectChanges());
      });
      if (this.cachedAudienceSubs.has(cacheKey)) this.cachedAudienceSubs.get(cacheKey)?.unsubscribe();
      this.cachedAudienceSubs.set(cacheKey, currentSub);
    } else {
      component.instance.selectedVars = [];
      setTimeout(() => component.changeDetectorRef.detectChanges());
    }
  }

  private calcInvestment(attributes: any) : string {
    const impProject: ImpProject = this.appStateService.currentProject$.getValue();
    const season = impProject.impGeofootprintMasters[0].methSeason?.toLocaleLowerCase();
    const hhc = attributes[`hhld_${season}`] ?? 0;
    const ownerGroupCpm = this.valMetricsService.getCpmForGeo(attributes['owner_group_primary'], attributes['cov_frequency']);
    const investment = isNil(impProject.estimatedBlendedCpm ?? ownerGroupCpm) ? null : (impProject.estimatedBlendedCpm ?? ownerGroupCpm) * hhc / 1000;
    const result = investment?.toFixed(2);
    return isNil(result) ? 'N/A' : `$ ${result}`;
  }

  private convertVarsForPopup(currentGeocode: string, vars: DynamicVariable[], audiences: Audience[]) : NodeVariable[] {
    const currentVar = vars.filter(v => v.geocode === currentGeocode)[0];
    return audiences.map(a => {
      return {
        name: a.audienceSourceType === 'Online' ? `${a.audienceName} (${a.audienceSourceName})` : a.audienceName,
        value: currentVar[a.audienceIdentifier],
        isNumber: a.fieldconte !== FieldContentTypeCodes.Char,
        digitRounding: this.fullyRoundedContentTypes.has(a.fieldconte) ? 0 : 2
      };
    });
  }
}
