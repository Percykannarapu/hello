import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { Store } from '@ngrx/store';
import { EsriGeographyPopupComponent, NodeVariable, PopupDefinition } from '@val/esri';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { GeoVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.model';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import { FullAppState } from 'app/state/app.interfaces';
import { ImpProjectVar } from 'app/val-modules/targeting/models/ImpProjectVar';
import { LoggingService } from '../val-modules/common/services/logging.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ValMetricsService } from './app-metrics.service';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

const convertToNodeVariable = (mapVar: MapVar | GeoVar, audience: Audience, impVar: ImpProjectVar) : NodeVariable => {
  const fieldType = audience.fieldconte.toUpperCase();
  const digits: number = fieldType === 'RATIO' || fieldType === 'PERCENT' ? 2 : 0;

  return {
    value: audience.audienceSourceType === 'Combined' ? audience.combinedAudiences.map(val => mapVar[val] as number).reduce((a, b) => a + b, 0) : mapVar[audience.audienceIdentifier],
    digitRounding: digits,
    isNumber: impVar.isNumber,
    name: audience.audienceSourceType === 'Combined' ? audience.audienceName : impVar.customVarExprDisplay
  };
};

@Injectable({
  providedIn: 'root'
})
export class AppComponentGeneratorService {

  private cachedGeoPopup: Map<string, ComponentRef<EsriGeographyPopupComponent>> =  new Map<string, ComponentRef<EsriGeographyPopupComponent>>();

  constructor(private appStateService: AppStateService,
              private targetAudienceService: TargetAudienceService,
              private impGeofootprintVarService: ImpGeofootprintVarService,
              private logger: LoggingService,
              private resolver: ComponentFactoryResolver,
              private injector: Injector,
              private valMetricsService: ValMetricsService,
              private store$: Store<FullAppState>) {
    this.appStateService.refreshDynamicContent$.subscribe(() => this.updateDynamicComponents());
  }

  public geographyPopupFactory(feature: __esri.Feature, fields: __esri.FieldInfo[], layerId: string, popupDefinition: PopupDefinition) : HTMLElement {
    const requestedGeocode = feature.graphic.attributes.geocode;
    this.logger.debug.log(`Building popup for geocode ${requestedGeocode} for layer id ${layerId}`);
    const cacheKey = requestedGeocode + layerId;
    if (!this.cachedGeoPopup.has(cacheKey)) {
      const popup = this.createGeographyPopup(cacheKey);
      this.populateGeographyPopupData(requestedGeocode, feature, fields, popupDefinition, popup);
    }
    if (this.cachedGeoPopup.get(cacheKey) != null && this.cachedGeoPopup.get(cacheKey).location != null) {
      return this.cachedGeoPopup.get(cacheKey).location.nativeElement;
    }
  }

  public cleanUpGeoPopup() : void {
    this.logger.debug.log('Destroying popup instance');
    if (this.cachedGeoPopup.size > 0) {
      this.cachedGeoPopup.forEach(g => {
        if (g != null)  g.destroy();
      });
    }
    this.cachedGeoPopup.clear();
  }

  private createGeographyPopup(cacheKey: string) : ComponentRef<EsriGeographyPopupComponent> {
    const factory = this.resolver.resolveComponentFactory(EsriGeographyPopupComponent);
    this.logger.debug.log('Instantiating new popup component');
    const result = factory.create(this.injector);
    this.cachedGeoPopup.set(cacheKey , result) ;
    return result;
  }

  private populateGeographyPopupData(geocode: string, feature: __esri.Feature, fields: __esri.FieldInfo[], popupDefinition: PopupDefinition, component: ComponentRef<EsriGeographyPopupComponent>) : void {
    this.logger.debug.log('Setting popup values', geocode, feature.graphic.attributes, fields, popupDefinition);

    const invest = this.calcInvestment(feature.graphic.attributes);
    feature.graphic.setAttribute('Investment', invest != null && invest !== '0.00' ? `$${invest}` : 'N/A');

    const fieldNames = fields.map(f => f.fieldName);
    if (!fieldNames.includes('Investment')) {
      const attr = {} as  __esri.FieldInfo;
      attr.fieldName = 'Investment';
      attr.label = 'Investment';
      fields.push(attr);
    }

    component.instance.geocode = geocode;
    component.instance.geoVars = [];
    component.instance.attributes = feature.graphic.attributes;
    component.instance.attributeFields = fields;
    component.instance.customPopupDefinition = popupDefinition;
    component.changeDetectorRef.detectChanges();
  }

  private updateDynamicComponents() : void {
    if (this.cachedGeoPopup.size > 0) this.cachedGeoPopup.forEach(k =>  k.changeDetectorRef.detectChanges());
  }

  private calcInvestment(attributes: any){
    const impProject: ImpProject = this.appStateService.currentProject$.getValue();
    const hhc = impProject.impGeofootprintMasters[0].methSeason != null ? attributes[`hhld_${impProject.impGeofootprintMasters[0].methSeason.toLocaleLowerCase()}`] : 0;
    let investment: number;
    const ownerGroupCpm = this.valMetricsService.getCpmForGeo(attributes['owner_group_primary'], attributes['cov_frequency']);
    investment = impProject.estimatedBlendedCpm != null && hhc != null ? impProject.estimatedBlendedCpm * hhc / 1000 :
      hhc == null ? 0 :
        ownerGroupCpm != null  ? ownerGroupCpm * hhc / 1000 : null;
    return investment != null ? investment.toFixed(2) : null;
  }
}
