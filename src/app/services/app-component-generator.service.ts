import { ComponentFactoryResolver, ComponentRef, Injectable, Injector } from '@angular/core';
import { CustomPopUpDefinition } from '../../environments/environment-definitions';
import { EsriGeographyPopupComponent } from '../components/esri-geography-popup/esri-geography-popup.component';
import { AppStateService } from './app-state.service';

@Injectable({
  providedIn: 'root'
})
export class AppComponentGeneratorService {

  private cachedGeoPopup: ComponentRef<EsriGeographyPopupComponent>;

  constructor(private resolver: ComponentFactoryResolver, private injector: Injector, private appStateService: AppStateService) {
    this.appStateService.refreshDynamicContent$.subscribe(() => this.updateDynamicComponents());
  }

  public geographyPopupFactory(feature: __esri.Feature, fields: __esri.PopupTemplateFieldInfos[], popupDefinition: CustomPopUpDefinition) : HTMLElement {
    const requestedGeocode = feature.graphic.attributes.geocode;
    if (this.cachedGeoPopup == null) {
      this.createGeographyPopup();
    }
    const component = this.cachedGeoPopup;
    if (this.cachedGeoPopup.instance.currentGeocode !== requestedGeocode) {
      component.instance.geocode = requestedGeocode;
      component.instance.attributes = feature.graphic.attributes;
      component.instance.attributeFields = fields;
      component.instance.customPopupDefinition = popupDefinition;
      component.changeDetectorRef.detectChanges();
    }
    return component.location.nativeElement;
  }

  public cleanUpGeoPopup() : void {
    if (this.cachedGeoPopup != null) this.cachedGeoPopup.destroy();
    this.cachedGeoPopup = null;
  }

  private createGeographyPopup() : void {
    const factory = this.resolver.resolveComponentFactory(EsriGeographyPopupComponent);
    this.cachedGeoPopup = factory.create(this.injector);
  }

  private updateDynamicComponents() : void {
    if (this.cachedGeoPopup != null) this.cachedGeoPopup.changeDetectorRef.detectChanges();
  }
}
