export interface LayerIdDefinition {
  centroid: string;
  boundary: string;
}

export interface EnvironmentData {
  debugMode: boolean,
  environmentName: string;
  fuseBaseUrl: string;
  production: boolean;
  esri: {
    portalServer: string;
    username: string;
    password: string;
  };
  layerIds: {
    zip: LayerIdDefinition;
    atz: LayerIdDefinition;
    wrap: LayerIdDefinition;
  };
}
