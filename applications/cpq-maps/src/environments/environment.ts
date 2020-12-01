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
    portalServer: 'https://gis.valassislab.com/',
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
      boundary: '23a54308e914496aa24d94a9b36776a0',
      centroid: '88120ac630d746239b133296e87b8e1f',
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_Very_Simplified/FeatureServer/0'
    },
    atz: {
      boundary: 'c0ee701ee95f4bbdbc15ded2a37ca802',
      centroid: 'fd4b078fc2424dd5a48af860dc421431',
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_Very_Simplified/FeatureServer/0'
    },
    dtz: {
      boundary: 'a4449b3ee55442af881f6ac660ca8163',
      centroid: '377018a24ba14afa9e02e56110b3a568',
      serviceUrl: ''
    },
    wrap: {
      boundary: '12bae62392eb47aeb887b6509da557b5',
      centroid: undefined,
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/Wrap_Top_Vars_Very_Simplified/FeatureServer/0'
    }
  },
  portalUrl: 'https://gis.valassislab.com',

};
