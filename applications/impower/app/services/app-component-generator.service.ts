import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, tap, withLatestFrom } from 'rxjs/operators';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ValMetricsService } from './app-metrics.service';
import { CustomPopUpDefinition, EsriGeographyPopupComponent, NodeVariable } from '@val/esri';
import { filterArray, mapArray, mapBy, safe } from '@val/common';
import { FullAppState } from 'app/state/app.interfaces';
import { Store } from '@ngrx/store';
import { getMapVars } from 'app/impower-datastore/state/transient/map-vars/map-vars.selectors';
import { getAllAudiences, getAudiencesOnMap, allAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { MapVar } from 'app/impower-datastore/state/transient/map-vars/map-vars.model';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { ImpProjectVar } from 'app/val-modules/targeting/models/ImpProjectVar';
import { getGeoVars } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.selectors';
import { GeoVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.model';

const convertToNodeVariable = (mapVar: MapVar | GeoVar, audience: any, impVar: any) : NodeVariable => {
  const fieldType = audience.fieldconte.toUpperCase();
  const digits: number = fieldType === 'RATIO' || fieldType === 'PERCENT' ? 2 : 0;
  
  return {
    value: audience.audienceSourceType === 'Combined' ? audience.combinedAudiences.map(val => mapVar[val]).reduce((a, b) => a + b) : mapVar[audience.audienceIdentifier], 
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

  private shadingSub: Subscription;
  private audienceSub: Subscription;

  private mapVars: MapVar[] = [];
  private audiences: Audience[] = [];
  private geoVars: GeoVar[] = [];

  constructor(private appStateService: AppStateService,
              private targetAudienceService: TargetAudienceService,
              private impGeofootprintVarService: ImpGeofootprintVarService,
              private logger: AppLoggingService,
              private resolver: ComponentFactoryResolver,
              private injector: Injector,
              private valMetricsService: ValMetricsService,
              private store$: Store<FullAppState>) {
    this.appStateService.refreshDynamicContent$.subscribe(() => this.updateDynamicComponents());

     this.store$.select(getMapVars).pipe(
      filter(mapVars => mapVars.length > 0),
    ).subscribe(data => this.mapVars = data);

    this.store$.select(allAudiences).pipe(
      filter(audiences => audiences.length > 0),
    ).subscribe(data => this.audiences = data);

    this.store$.select(getGeoVars).pipe(
      filter(geoVars => geoVars.length > 0)
    ).subscribe(data => this.geoVars = data);

  }

  public geographyPopupFactory(feature: __esri.Feature, fields: __esri.FieldInfo[], popupDefinition: CustomPopUpDefinition) : HTMLElement {
    const requestedGeocode = feature.graphic.attributes.geocode;
    this.logger.debug.log(`Building popup for geocode ${requestedGeocode}`);
    if (!this.cachedGeoPopup.has(requestedGeocode)) {
      const popup = this.createGeographyPopup(requestedGeocode);
      this.populateGeographyPopupData(requestedGeocode, feature, fields,popupDefinition, popup);
    } 
    if (this.cachedGeoPopup.get(requestedGeocode) != null && this.cachedGeoPopup.get(requestedGeocode).location != null) {
     return this.cachedGeoPopup.get(requestedGeocode).location.nativeElement;
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

  private createGeographyPopup(geocode: string) : ComponentRef<EsriGeographyPopupComponent> {
    const factory = this.resolver.resolveComponentFactory(EsriGeographyPopupComponent);
    this.logger.debug.log('Instantiating new popup component');
    const result = factory.create(this.injector);
    this.cachedGeoPopup.set(geocode , result) ;
    return result;
  }

  private populateGeographyPopupData(geocode: any, feature: __esri.Feature, fields: __esri.FieldInfo[], popupDefinition: CustomPopUpDefinition, component: ComponentRef<EsriGeographyPopupComponent>) : void {
    this.logger.debug.log('Setting popup values', geocode, feature.graphic.attributes, fields, popupDefinition);
    const mapVars: MapVar[] = this.mapVars.filter(mapVar => mapVar.geocode === geocode);
    const impProjectVars: ImpProjectVar[] = this.appStateService.currentProject$.getValue().impProjectVars.filter(impVar => impVar.isShadedOnMap);
    const mapAudiences = this.audiences.filter(aud => aud.showOnMap);

    if (this.cachedGeoPopup != null && this.cachedGeoPopup.size > 0 && mapVars.length > 0)
       this.cachedGeoPopup.get(geocode).instance.mapVar = convertToNodeVariable(mapVars[0], mapAudiences[0], impProjectVars[0]);
    const geoVars: GeoVar[] = this.geoVars.filter(geoVar => geoVar.geocode === geocode);
    const nodeVariables: NodeVariable[] = [];
    if (this.cachedGeoPopup != null && this.cachedGeoPopup.size > 0 && this.cachedGeoPopup.has(geocode) && geoVars.length > 0){
      this.audiences.forEach(aud => 
        nodeVariables.push(convertToNodeVariable(geoVars[0], aud, this.appStateService.currentProject$.getValue().impProjectVars.filter( v => v.varPk.toString() === aud.audienceIdentifier)[0]) )
      );
      this.cachedGeoPopup.get(geocode).instance.geoVars = nodeVariables;
    }

    const invest = this.calcInvestment(feature.graphic.attributes);
    feature.graphic.setAttribute('Investment', invest != null && invest !== '0.00' ? `$${invest}` : 'N/A');

    const fieldNames = [];
    fields.forEach(fild => fieldNames.push(fild.fieldName));

    if (!fieldNames.includes('Investment')) {
      const attr = {} as  __esri.FieldInfo;
      attr.fieldName = 'Investment';
      attr.label = 'Investment';
      fields.push(attr);
      popupDefinition.rootFields.push('Investment');
    }
      component.instance.geocode = geocode;
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
    const hhc = impProject.impGeofootprintMasters[0].methSeason != null ? attributes[`hhld_${impProject.impGeofootprintMasters[0].methSeason.toLocaleLowerCase()}`]: 0;
    let investment: number;
    const ownerGroupCpm = this.valMetricsService.getCpmForGeo(attributes['owner_group_primary'], attributes['cov_frequency']);
    investment = impProject.estimatedBlendedCpm != null && hhc != null ? impProject.estimatedBlendedCpm * hhc / 1000 :
                 hhc == null ? 0 :
                 ownerGroupCpm != null  ? ownerGroupCpm * hhc / 1000 : null;
    return investment != null ? investment.toFixed(2) : null;
  }
}
