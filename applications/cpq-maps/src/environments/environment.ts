/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
import { LogLevels } from '@val/common'; // Included with Angular CLI.
import 'zone.js/dist/zone-error';
import { EnvironmentData } from './environmentData';

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment: EnvironmentData = {
  debugMode: true,
  environmentName: 'DEV',
  fuseBaseUrl: 'https://servicesdev.valassislab.com/services/',
  production: false,
  logLevel: LogLevels.ALL,
  esri: {
    // portalServer: 'https://impowerqa.valassis.com/',
    portalServer: 'https://valvcsimpor1vm.val.vlss.local/',
    username: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  },

  /* Layer IDs and URLs for new ESRI Server
  layerIds: {
    zip: {
      boundary: '28ab27c41d214e7e83a4f05372c7f387',
      centroid: '1be0a79bf27b46ce82cf459fd70c1bad',
      serviceUrl: 'https://impowerqa.valassis.com/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_Very_Simplified/FeatureServer/0'
    },
    atz: {
      boundary: '9918dff6c1b34b139cb00bc3561ad81a',
      centroid: 'b58a024badbc4b63bce258aceaab7f31',
      serviceUrl: 'https://impowerqa.valassis.com/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_Very_Simplified/FeatureServer/0'
    },
    dtz: {
      boundary: '45aedd8bb4d845bb999c287d76009372',
      centroid: 'e44e37afe10d4145b5e09d1a9027003b',
      serviceUrl: ''
    },
    wrap: {
      boundary: '7fa52ae91fb047519a7e3e1651d91b1b',
      centroid: undefined,
      serviceUrl: 'https://impowerqa.valassis.com/arcgis-server/rest/services/Hosted/Wrap_Top_Vars_Very_Simplified/FeatureServer/0'
    }
  },
  portalUrl: 'https://impowerqa.valassis.com',
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
  portalUrl: 'https://valvcsimpor1vm.val.vlss.local',
};
