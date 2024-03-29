import { ComponentFactoryResolver, ElementRef, Injectable, Injector } from '@angular/core';
import PopupTemplate from '@arcgis/core/PopupTemplate';
import { EsriLayerService, EsriMapService } from '@val/esri';
import { take } from 'rxjs/operators';
import { MapPopupComponent } from '../components/map-popup/map-popup.component';
import { ConfigService } from './config.service';

@Injectable({
  providedIn: 'root'
})
export class AppPopupService {

  constructor(private configService: ConfigService,
              private esriLayerService: EsriLayerService,
              private esriMapService: EsriMapService,
              private resolver: ComponentFactoryResolver,
              private injector: Injector) { }

  public initializePopups(analysisLevel: string) {
    const layerNames = ['zip', 'atz', 'wrap'];
    layerNames.forEach(name => {
      const layerId = this.configService.layers[name].boundaries.id;
      const layer = this.esriLayerService.getPortalLayerById(layerId);
      if (name !== analysisLevel || name === 'wrap') {
        layer.popupTemplate = null;
        return;
      }
      layer.popupTemplate = new PopupTemplate({
        title: '{geocode} {city_name}',
        content: (feature: __esri.Feature) => this.createPopup(feature),
        outFields: this.configService.popupFields.map(f => f.fieldName)
      });
    });
  }

  private createPopup(feature: __esri.Feature) : ElementRef {
    const popupFactory = this.resolver.resolveComponentFactory(MapPopupComponent);
    const popupComponent = popupFactory.create(this.injector);
    const popupWatch = this.esriMapService.mapView.popup.watch('visible', value => {
      if (!value) {
        popupComponent.destroy();
        popupWatch.remove();
      }
    });
    popupComponent.instance.mapView = this.esriMapService.mapView;
    popupComponent.instance.selectedFeature = feature;
    popupComponent.instance.fields = this.configService.popupFields;
    popupComponent.instance.closePopup.pipe(
      take(1)
    ).subscribe(() => {
      this.esriMapService.mapView.popup.close();
    });
    popupComponent.changeDetectorRef.detectChanges();
    return popupComponent.location.nativeElement;
  }
}
