import { Injectable } from '@angular/core';
import { LogLevels } from '@val/common';
import { LayerIdDefinition } from '@val/esri';
import { environment, EnvironmentData } from '../environments/environment';
import { LoggingConfiguration } from './val-modules/common/services/logging.service';

@Injectable()
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
  public maxRadiusTradeAreas = 3;
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
    deleteGeoCacheUrl: 'v1/targeting/base/chunkedgeos/deleteChunks/'
  };

  public analysisLevelToLayerKey(analysisLevel: string) : string {
    switch ((analysisLevel || '').toLowerCase()) {
      case 'digital atz':
        return 'dtz';
      case '':
        throw new Error(`Invalid analysis level '${analysisLevel}' passed into AppConfig::analysisLevelToLayerKey`);
      default:
        return analysisLevel.toLowerCase();
    }
  }

  public getLayerConfigForAnalysisLevel(analysisLevel: string) : LayerIdDefinition {
    const layerKey = this.analysisLevelToLayerKey(analysisLevel);
    return EnvironmentData.layerIds[layerKey];
  }

  public getLayerIdForAnalysisLevel(analysisLevel: string, boundary: boolean = true, forceFullDetail: boolean = false) : string {
    const config = this.getLayerConfigForAnalysisLevel(analysisLevel);
    return boundary
      ? this.isBatchMode && !forceFullDetail ? config.simplifiedBoundary || config.boundary : config.boundary
      : config.centroid || null;
  }
}
