import { Injectable } from '@angular/core';
import Color from '@arcgis/core/Color';
import { geodesicBuffer } from '@arcgis/core/geometry/geometryEngine';
import Point from '@arcgis/core/geometry/Point';
import Graphic from '@arcgis/core/Graphic';
import SimpleRenderer from '@arcgis/core/renderers/SimpleRenderer';
import SimpleFillSymbol from '@arcgis/core/symbols/SimpleFillSymbol';
import SimpleLineSymbol from '@arcgis/core/symbols/SimpleLineSymbol';
import SimpleMarkerSymbol from '@arcgis/core/symbols/SimpleMarkerSymbol';
import { groupByExtended } from '@val/common';
import { EsriDomainFactory, EsriLayerService, MapSymbols } from '@val/esri';
import { RfpUiEdit } from '../../val-modules/mediaexpress/models/RfpUiEdit';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';

@Injectable({
  providedIn: 'root'
})
export class AppSiteService {

  constructor(private layerService: EsriLayerService) { }

  createSiteFeatureLayer(edits: RfpUiEdit[], details: RfpUiEditDetail[], radius: number, groupName: string, layerName: string) : void {
    const siteGraphics = this.createSiteGraphics(edits, details, radius);
    const renderer = new SimpleRenderer({
      label: 'Client Locations',
      symbol: new SimpleMarkerSymbol({
        color: [0, 0, 255, 1],
        path: MapSymbols.STAR,
        outline: new SimpleLineSymbol({
          color: [0, 0, 0, 0],
          width: 0
        })
      })
    });
    const label = EsriDomainFactory.createLabelClass(new Color([0, 0, 255, 1]), '$feature.siteName');
    this.layerService.createClientLayer(groupName, layerName, siteGraphics, 'OBJECTID', renderer, null, [label], true);
  }

  private createSiteGraphics(edits: RfpUiEdit[], details: RfpUiEditDetail[], radius: number) : __esri.Graphic[] {
    const ihdsBySiteFk = groupByExtended(details, d => d.fkSite, d => d.ihDate.valueOf());
    return edits.map(e => {
      const graphic = this.layerService.coordinateToGraphic({ x: e.siteLong, y: e.siteLat });
      const ihds = ihdsBySiteFk.has(e.siteId) ? new Set(ihdsBySiteFk.get(e.siteId)) : new Set<number>();
      const ihdString = Array.from(ihds).map(d => new Date(d).toLocaleDateString()).join(' ,');
      graphic.setAttribute('OBJECTID', Number(e['@ref']));
      graphic.setAttribute('siteId', e['@ref'].toString());
      graphic.setAttribute('siteFk', e.siteId.toString());
      graphic.setAttribute('siteName', e.siteName);
      graphic.setAttribute('radius', radius.toString());
      graphic.setAttribute('inHomeDate', ihdString);
      return graphic;
    });
  }

  createSiteRadii(edits: RfpUiEdit[], radius: number) : __esri.Graphic[] {
    const symbol = new SimpleFillSymbol({
      style: 'solid',
      color: [0, 0, 0, 0],
      outline: {
        style: 'solid',
        color: [0, 0, 255, 1],
        width: 2
      }
    });
    const points = edits.map(e => new Point({ latitude: e.siteLat, longitude: e.siteLong }));
    const buffer = geodesicBuffer(points, radius, 'miles', false);
    const bufferArray = Array.isArray(buffer) ? buffer : [buffer];
    return bufferArray.map(geometry => new Graphic({ geometry, symbol }));
  }
}
