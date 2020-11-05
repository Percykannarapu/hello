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
  environmentName: 'QA',
  fuseBaseUrl: 'https://services.valassislab.com/services/',
  production: false,
  logLevel: LogLevels.WARN,
  esri: {
    portalServer: 'https://impowerqa.valassis.com/',
    username: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  },
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
      boundary: '5e81da421ebf402e98d64622f84b3603',
      centroid: 'e44e37afe10d4145b5e09d1a9027003b',
      serviceUrl: ''
    },
    wrap: {
      boundary: '7fa52ae91fb047519a7e3e1651d91b1b',
      centroid: undefined,
      serviceUrl: 'https://impowerqa.valassis.com/arcgis-server/rest/services/Hosted/Wrap_Top_Vars_Very_Simplified/FeatureServer/0'
    }
  },
  portalUrl: 'https://impowerqa.valassis.com'
};
