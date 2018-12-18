export interface LayerIdDefinition {
  centroid: string;
  boundary: string;
}

export interface EnvironmentData {
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
