export interface EnvironmentData {
  production: boolean;
  esri: {
    portalServer: string;
    username: string;
    password: string;
  };
  layerIds: {
    zip: {
      centroid: string;
      boundary: string;
    };
    atz: {
      centroid: string;
      boundary: string;
    }
  };
}
