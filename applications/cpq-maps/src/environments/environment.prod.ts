import { LogLevels } from '@val/common';
import { EnvironmentData } from './environmentData';

export const environment: EnvironmentData = {
  debugMode: false,
  environmentName: 'PROD',
  fuseBaseUrl: 'https://services.valassis.com/services/',
  production: true,
  logLevel: LogLevels.ERROR,
  esri: {
    portalServer: 'https://impower.valassis.com/',
    username: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  },
  layerIds: {
    zip: {
      boundary: '3e2a4a9836864cfca10d87d0160d2697',
      centroid: '89cac0a2c866482b9d4e934105f445a2',
      serviceUrl: 'https://impower.valassis.com/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_Very_Simplified/FeatureServer/0'
    },
    atz: {
      boundary: 'fedd50a5759c45ccb41edd96713628f9',
      centroid: '9f56b26cf3ea4b93bc65cb90f831cf24',
      serviceUrl: 'https://impower.valassis.com/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_Very_Simplified/FeatureServer/0'
    },
    dtz: {
      boundary: 'a0927bb2fb064544beb2813556f8619b',
      centroid: '763c31ada0db4d09831edb2d19780c2d',
      serviceUrl: ''
    },
    wrap: {
      boundary: '02029682807247bd956f3667d949ffa5',
      centroid: undefined,
      serviceUrl: 'https://impower.valassis.com/arcgis-server/rest/services/Hosted/Wrap_Top_Vars_Very_Simplified/FeatureServer/0'
    }
  },
  portalUrl: 'https://impower.valassis.com'
};
