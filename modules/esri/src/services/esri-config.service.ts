import { Inject, Injectable } from '@angular/core';
import { isNil } from '@val/common';
import { EsriAppSettings, EsriAppSettingsToken, EsriConfigOptions, EsriLoaderToken } from '../configuration';
import { LayerKeys, LayerTypes } from '../core/esri.enums';

@Injectable()
export class EsriConfigService {

  public constructor(@Inject(EsriAppSettingsToken) private appConfig: EsriAppSettings,
                     @Inject(EsriLoaderToken) private esriConfig: EsriConfigOptions) {
  }

  public getLayerUrl(layerKey: LayerKeys.State | LayerKeys.DMA | LayerKeys.Counties) : string;
  public getLayerUrl(layerKey: LayerKeys.Wrap, layerType: LayerTypes.Polygon, isSimplified?: boolean) : string;
  public getLayerUrl(layerKey: LayerKeys | string, layerType: LayerTypes.Polygon, isSimplified?: boolean) : string;
  public getLayerUrl(layerKey: LayerKeys | string, layerType: LayerTypes.Point, isPOB?: boolean) : string;
  public getLayerUrl(layerKey: LayerKeys | string, layerType?: LayerTypes, simplifiedOrPOB: boolean = false) : string {
    const analysisLayerKeys = new Set([LayerKeys.Zip, LayerKeys.ATZ, LayerKeys.DTZ, LayerKeys.PCR]);
    const usableLayerKey: LayerKeys = LayerKeys.parse(layerKey);
    let fullLayerName: string;
    if (isNil(usableLayerKey)) return null;
    if (usableLayerKey === LayerKeys.State) {
      // this is the portal id for the Living Atlas entry on our local ArcGIS server, which has the destination url on the esri server.
      // e.g. our local server acts as a redirect to the esri asset. This is a necessity since esri has renamed this asset at least once.
      return '99fd67933e754a1181cc755146be21ca';
    } else if (usableLayerKey === LayerKeys.Wrap) {
      fullLayerName = `impower_${usableLayerKey}_boundary${simplifiedOrPOB ? '_simplified' : ''}`;
    } else if (analysisLayerKeys.has(usableLayerKey)) {
      if (layerType === LayerTypes.Polygon) {
        fullLayerName = `impower_${usableLayerKey}_boundary${simplifiedOrPOB ? '_simplified' : ''}`;
      } else {
        fullLayerName = `impower_${usableLayerKey}${simplifiedOrPOB ? '_pob' : '_centroid'}`;
      }
    } else {
      fullLayerName = usableLayerKey;
    }
    return `${this.appConfig.featureServiceRoot}${fullLayerName}/FeatureServer`;
  }

  public getAnalysisBoundaryUrl(layerKey: string, simplified: boolean) : string {
    const analysisLayerKeys = new Set([LayerKeys.Zip, LayerKeys.ATZ, LayerKeys.DTZ, LayerKeys.PCR]);
    const usableLayerKey = LayerKeys.parse(layerKey);
    if (!analysisLayerKeys.has(usableLayerKey)) return null;
    return this.getLayerUrl(usableLayerKey, LayerTypes.Polygon, simplified);
  }
}
