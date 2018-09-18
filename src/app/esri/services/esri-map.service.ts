import { ElementRef, Inject, Injectable } from '@angular/core';
import { EsriApi } from '../core/esri-api.service';
import { EsriAppSettingsConfig, EsriAppSettingsToken } from '../configuration';
import { EsriDomainFactoryService } from './esri-domain-factory.service';

@Injectable({
  providedIn: 'root'
})
export class EsriMapService {
  public mapView: __esri.MapView;

  constructor(private domainService: EsriDomainFactoryService,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettingsConfig) {}

  public zoomOnMap(xStats: { min: number, max: number }, yStats: { min: number, max: number }, pointCount: number) : void {
    if (pointCount === 0) return;
    this.mapView.extent = this.domainService.createExtent(xStats, yStats, 0.15);
    if (pointCount === 1) {
      this.mapView.zoom = 12;
    } else {
      this.mapView.zoom -= 1;
    }
  }

  public createBasicWidget(constructor: __esri.WidgetConstructor, properties?: any, position: string = 'top-left') : void {
    const newProperties = { view: this.mapView, ...properties };
    const result = new constructor(newProperties);
    this.addWidget(result, position);
  }

  public createHiddenWidget(constructor: __esri.WidgetConstructor, widgetProperties?: any, expanderProperties?: __esri.ExpandProperties, position: string = 'top-left') : void {
    const newWidgetProps = { view: this.mapView, container: document.createElement('div'), ...widgetProperties };
    const result = new constructor(newWidgetProps);
    const newExpanderProps = { view: this.mapView, ...expanderProperties, content: result.container };
    const expander = new EsriApi.widgets.Expand(newExpanderProps);
    this.addWidget(expander, position);
  }

  private addWidget(item: __esri.Widget, position: string);
  private addWidget(item: ElementRef | __esri.Widget, position: string) {
    if (item instanceof ElementRef) {
      this.mapView.ui.add(item.nativeElement, position);
    } else {
      this.mapView.ui.add(item, position);
    }
  }
}
