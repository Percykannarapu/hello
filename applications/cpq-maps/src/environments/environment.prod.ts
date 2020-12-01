import { LogLevels } from '@val/common';
import { EnvironmentData } from './environmentData';

export const environment: EnvironmentData = {
  debugMode: false,
  environmentName: 'PROD',
  fuseBaseUrl: 'https://services.valassis.com/services/',
  production: true,
  logLevel: LogLevels.ERROR,
  esri: {
    // portalServer: 'https://impower.valassis.com/',
    portalServer: 'https://valvcsimpor1vm.val.vlss.local/',
    username: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  },

  /* Layer IDs and URLs for new ESRI Server
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
*/
layerIds: {
  zip: {
    boundary: 'b1d2b37add4d470ca32bfd9f40d91b9f',
    centroid: 'f0dd4c98bd3843c2b7ed16f04040ff13',
    serviceUrl: 'https://valvcsimpor1vm.val.vlss.local/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_Very_Simplified/FeatureServer/0'
  },
  atz: {
    boundary: 'dac5cea6976a42ceb3f0498d2c901447',
    centroid: '7bde296c08254ed78460accd00c8af49',
    serviceUrl: 'https://valvcsimpor1vm.val.vlss.local/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_Very_Simplified/FeatureServer/0'
  },
  dtz: {
    boundary: '9230ad1f421847f08d6bf0ae2f8ba00f',
    centroid: 'ae57986ce91144e98a65208ef8ae5a1d',
    serviceUrl: ''
  },
  wrap: {
    boundary: '8dbaa84192c94b5eab3f4e685ba93af7',
    centroid: undefined,
    serviceUrl: 'https://valvcsimpor1vm.val.vlss.local/arcgis-server/rest/services/Hosted/Wrap_Top_Vars_Very_Simplified/FeatureServer/0'
  }
},
portalUrl: 'https://valvcsimpor1vm.val.vlss.local/'
};

