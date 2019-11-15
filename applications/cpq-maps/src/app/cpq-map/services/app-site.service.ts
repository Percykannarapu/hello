import { Injectable } from '@angular/core';
import { groupByExtended } from '@val/common';
import { EsriApi, EsriDomainFactoryService, EsriLayerService, MapSymbols } from '@val/esri';
import { RfpUiEdit } from '../../val-modules/mediaexpress/models/RfpUiEdit';
import { RfpUiEditDetail } from '../../val-modules/mediaexpress/models/RfpUiEditDetail';

@Injectable({
  providedIn: 'root'
})
export class AppSiteService {

  constructor(private layerService: EsriLayerService,
              private esriFactory: EsriDomainFactoryService) { }

  createSiteFeatureLayer(edits: RfpUiEdit[], details: RfpUiEditDetail[], radius: number, groupName: string, layerName: string) : void {
    const siteGraphics = this.createSiteGraphics(edits, details, radius);
    const renderer = new EsriApi.SimpleRenderer({
      label: 'Client Locations',
      symbol: new EsriApi.SimpleMarkerSymbol({
        color: [0, 0, 255, 1],
        path: MapSymbols.STAR,
        outline: new EsriApi.SimpleLineSymbol({
          color: [0, 0, 0, 0],
          width: 0
        })
      })
    });
    const label = this.esriFactory.createLabelClass(new EsriApi.Color([0, 0, 255, 1]), '$feature.siteName');
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
    const symbol = new EsriApi.SimpleFillSymbol({
      style: 'solid',
      color: [0, 0, 0, 0],
      outline: {
        style: 'solid',
        color: [0, 0, 255, 1],
        width: 2
      }
    });
    const points = edits.map(e => new EsriApi.Point({ latitude: e.siteLat, longitude: e.siteLong }));
    const buffer = EsriApi.geometryEngine.geodesicBuffer(points, radius, 'miles', false);
    const bufferArray = Array.isArray(buffer) ? buffer : [buffer];
    return bufferArray.map(geometry => new EsriApi.Graphic({ geometry, symbol }));
  }
}
