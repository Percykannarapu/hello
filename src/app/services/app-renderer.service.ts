import { Injectable } from '@angular/core';
import { EsriModules } from '../esri-modules/core/esri-modules.service';
import { ValGeoService } from './app-geo.service';
import { Subscription } from 'rxjs/Subscription';

@Injectable()
export class AppRendererService {
  private geoSubscription: Subscription;
  private currentGeocodes: Set<string> = new Set<string>();

  constructor(private geoService: ValGeoService) {
    this.geoSubscription = this.geoService.uniqueSelectedGeocodes$.subscribe(geos => {
      this.currentGeocodes.clear();
      geos.forEach(geo => this.currentGeocodes.add(geo));
    });
  }

  public createSelectionRenderer(defaultSymbol: __esri.Symbol) : __esri.Renderer {
    const selectedGeo = (feature: __esri.Graphic) => this.currentGeocodes.has(feature.attributes.geocode) ? 'Selected Geo' : 'Unselected Geo';
    // 53, 157, 163
    const highlightColor = new EsriModules.Color([0, 255, 0, 0.25]);
    const outlineColor = new EsriModules.Color([0, 0, 0, 1]);
    const highlightSymbol = new EsriModules.SimpleFillSymbol({
      color: highlightColor,
      outline: { color: outlineColor, style: 'solid', width: 1},
      style: 'solid'
    });
    const newRenderer = new EsriModules.UniqueValueRenderer({
      defaultSymbol: defaultSymbol,
      field: selectedGeo
    });
    newRenderer.addUniqueValueInfo('Selected Geo', highlightSymbol);
    return newRenderer;
  }

  public createSmartShadingRenderer() : __esri.Renderer {
    // TODO: move the smart shading renderer generation here
    return null;
  }
}
