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

  // Authentication info
  public authenticated: boolean = EnvironmentData.authenticated;
  public clientId = EnvironmentData.clientId;
  public clientSecret = EnvironmentData.clientSecret;
  public oAuthParams = EnvironmentData.oAuth;

  // Urls
  public valServiceBase = `${EnvironmentData.fuseBaseUrl}`;
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

  public basemaps = [
    'streets-vector',
    'streets-navigation-vector',
    'gray-vector',
    'dark-gray-vector',
    'topo-vector',
    'satellite',
    'oceans'
  ];

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

  public getLayerIdForAnalysisLevel(analysisLevel: string, boundary: boolean = true) : string {
    const config = this.getLayerConfigForAnalysisLevel(analysisLevel);
    return boundary
      ? this.isBatchMode ? config.simplifiedBoundary || config.boundary : config.boundary
      : config.centroid || null;
  }
}
