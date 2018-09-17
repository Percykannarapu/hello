import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { CustomPopUpDefinition } from '../esri/layer-configuration';
import { EsriGeographyPopupComponent, NodeVariable } from '../esri/components/esri-geography-popup/esri-geography-popup.component';
import { filterArray, mapArray } from '../val-modules/common/common.rxjs';
import { ImpGeofootprintVar } from '../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpGeofootprintVarService } from '../val-modules/targeting/services/ImpGeofootprintVar.service';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';
import { TargetAudienceService } from './target-audience.service';

const convertToNodeVariable = (variable: ImpGeofootprintVar) : NodeVariable => {
  const fieldType = (variable.fieldconte || '').toUpperCase();
  const digits: number = fieldType === 'RATIO' || fieldType === 'PERCENT' ? 2 : 0;
  return {
    value: variable.isNumber ? variable.valueNumber : variable.valueString,
    digitRounding: digits,
    isNumber: variable.isNumber,
    name: variable.customVarExprDisplay
  };
};

@Injectable({
  providedIn: 'root'
})
export class AppComponentGeneratorService {

  private cachedGeoPopup: ComponentRef<EsriGeographyPopupComponent>;

  private shadingSub: Subscription;
  private audienceSub: Subscription;

  constructor(private appStateService: AppStateService,
              private targetAudienceService: TargetAudienceService,
              private impGeofootprintVarService: ImpGeofootprintVarService,
              private logger: AppLoggingService,
              private resolver: ComponentFactoryResolver,
              private injector: Injector) {
    this.appStateService.refreshDynamicContent$.subscribe(() => this.updateDynamicComponents());
  }

  public geographyPopupFactory(feature: __esri.Feature, fields: __esri.PopupTemplateFieldInfos[], popupDefinition: CustomPopUpDefinition) : HTMLElement {
    const requestedGeocode = feature.graphic.attributes.geocode;
    this.logger.info(`Building popup for geocode ${requestedGeocode}`);
    if (this.cachedGeoPopup == null) {
      this.createGeographyPopup();
    }
    if (this.cachedGeoPopup.instance.currentGeocode !== requestedGeocode) {
      this.populateGeographyPopupData(requestedGeocode, feature, fields, popupDefinition);
    }
    return this.cachedGeoPopup.location.nativeElement;
  }

  public cleanUpGeoPopup() : void {
    this.logger.info('Destroying popup instance');
    if (this.cachedGeoPopup != null) this.cachedGeoPopup.destroy();
    this.cachedGeoPopup = null;
  }

  private createGeographyPopup() : void {
    const factory = this.resolver.resolveComponentFactory(EsriGeographyPopupComponent);
    this.logger.debug('Instantiating new popup component');
    this.cachedGeoPopup = factory.create(this.injector);
  }

  private populateGeographyPopupData(geocode: any, feature: __esri.Feature, fields: __esri.PopupTemplateFieldInfos[], popupDefinition: CustomPopUpDefinition) : void {
    this.logger.debug('Setting popup values', geocode, feature.graphic.attributes, fields, popupDefinition);
    if (this.shadingSub) this.shadingSub.unsubscribe();
    this.shadingSub = this.targetAudienceService.shadingData$.pipe(
      filter(dataDictionary => dataDictionary.has(geocode) && this.cachedGeoPopup != null),
      map(dataDictionary => dataDictionary.get(geocode)),
      distinctUntilChanged(),
      map(variable => convertToNodeVariable(variable))
    ).subscribe(nodeData => this.cachedGeoPopup.instance.mapVar = nodeData);
    if (this.audienceSub) this.audienceSub.unsubscribe();
    this.audienceSub = this.impGeofootprintVarService.storeObservable.pipe(
      filter(() => this.cachedGeoPopup != null),
      filterArray(v => v.geocode === geocode),
      mapArray(v => convertToNodeVariable(v))
    ).subscribe(nodeData => this.cachedGeoPopup.instance.geoVars = nodeData);
    this.cachedGeoPopup.instance.geocode = geocode;
    this.cachedGeoPopup.instance.attributes = feature.graphic.attributes;
    this.cachedGeoPopup.instance.attributeFields = fields;
    this.cachedGeoPopup.instance.customPopupDefinition = popupDefinition;
    this.cachedGeoPopup.changeDetectorRef.detectChanges();
  }

  private updateDynamicComponents() : void {
    if (this.cachedGeoPopup != null) this.cachedGeoPopup.changeDetectorRef.detectChanges();
  }
}
