import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { CustomPopUpDefinition } from '../../environments/environment-definitions';
import { EsriGeographyPopupComponent } from '../components/esri-geography-popup/esri-geography-popup.component';
import { AppLoggingService } from './app-logging.service';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class AppComponentGeneratorService {

  private cachedGeoPopup: ComponentRef<EsriGeographyPopupComponent>;

  constructor(private appStateService: AppStateService,
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
    const component = this.cachedGeoPopup;
    if (this.cachedGeoPopup.instance.currentGeocode !== requestedGeocode) {
      this.logger.debug('Setting popup values', requestedGeocode, feature.graphic.attributes, fields, popupDefinition);
      component.instance.geocode = requestedGeocode;
      component.instance.attributes = feature.graphic.attributes;
      component.instance.attributeFields = fields;
      component.instance.customPopupDefinition = popupDefinition;
      component.changeDetectorRef.detectChanges();
    }
    return component.location.nativeElement;
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

  private updateDynamicComponents() : void {
    if (this.cachedGeoPopup != null) this.cachedGeoPopup.changeDetectorRef.detectChanges();
  }
}
