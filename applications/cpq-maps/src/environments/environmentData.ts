import { LogLevels } from '@val/common';

export interface LayerIdDefinition {
  centroid: string;
  boundary: string;
  serviceUrl: string;
}

export interface EnvironmentData {
  debugMode: boolean;
  environmentName: string;
  fuseBaseUrl: string;
  production: boolean;
  logLevel: LogLevels;
  esri: {
    portalServer: string;
    username: string;
    password: string;
  };
  layerIds: {
    zip: LayerIdDefinition;
    atz: LayerIdDefinition;
    wrap: LayerIdDefinition;
    dtz: LayerIdDefinition
  };
  portalUrl: string;
}
