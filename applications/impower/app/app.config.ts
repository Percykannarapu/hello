import { Injectable } from '@angular/core';
import { LogLevels } from '@val/common';
import { LayerKeys } from '@val/esri';
import { environment, EnvironmentData } from '../environments/environment';
import { AnalysisLevel } from './common/models/ui-enums';
import { LoggingConfiguration } from './val-modules/common/services/logging.service';

@Injectable({ providedIn: 'root' })
export class AppConfig implements LoggingConfiguration {

  // Debug / logging info
  public environmentName = EnvironmentData.environmentName;
  public logLevel: LogLevels = environment.logLevel;

  // Urls
  public valServiceBase = EnvironmentData.fuseBaseUrl;
  public impowerBaseUrl = EnvironmentData.impowerBaseUrl;
  public serviceUrls = EnvironmentData.serviceUrls;
  public printServiceUrl = EnvironmentData.printServiceUrl;

  // Magic numbers
  public maxBufferRadius = 100;
  public maxValGeocodingReqSize = 50;
  public maxRadiusTradeAreas = 4;
  public geoInfoQueryChunks = 5;        // Number of chunks the geos will be split into for multi threading
  public maxGeosForPrecisionZoom = 100;

  // runtime flags
  public isBatchMode = false;

  public portalBaseMapNames = [
    { originalName: 'Streets', newName: 'Streets' },
    { originalName: 'Navigation', newName: 'World Navigation Map' },
    { originalName: 'Light Gray Canvas', newName: 'Light Gray Canvas' },
    { originalName: 'Dark Gray Canvas', newName: 'Dark Gray Canvas' },
    { originalName: 'Topographic', newName: 'Topographic' },
    { originalName: 'Imagery Hybrid', newName: 'Satellite' },
    { originalName: 'Oceans', newName: 'Oceans' },
  ];

  public serviceUrlFragments = {
    populateGeoCacheUrl: 'v1/targeting/base/chunkedgeos/populateChunkedGeos',
    deleteGeoCacheUrl: 'v1/targeting/base/chunkedgeos/deleteChunks/',
    unifiedAudienceUrl: 'v1/targeting/base/geoinfo/varlookup',
  };

  private nationalTransactionIds = {
    zip: 1,
    atz: 2,
    dtz: 3,
    pcr: 4
  };

  public getNationalTxId(analysisLevel: string) : number {
    const analysisKey = AnalysisLevel.parse(analysisLevel);
    return this.nationalTransactionIds[analysisKey];
  }

  public getAnalysisLevelFromLayerUrl(layerUrl: string) : string {
    const analysisLayerKeys = new Set([LayerKeys.Zip, LayerKeys.ATZ, LayerKeys.DTZ, LayerKeys.PCR]);
    const urlParts = layerUrl.split('/');
    const fullLayerName = urlParts.length > 1 ? urlParts[urlParts.length - 2] : '';
    const layerParts = fullLayerName.split('_');
    const layerLevel = layerParts.length > 1 ? layerParts[1] : null;
    return analysisLayerKeys.has(LayerKeys.parse(layerLevel)) ? layerLevel : null;
  }

  public fixupPortalIdToLayerKey(portalId: string) : LayerKeys {
    if (EnvironmentData.layerKeyFixup.has(portalId)) {
      return EnvironmentData.layerKeyFixup.get(portalId);
    }
    return null;
  }
}
