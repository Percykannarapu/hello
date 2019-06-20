/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.
import { EnvironmentData } from './environmentData';

// This file can be replaced during build by using the `fileReplacements` array.
// `ng build ---prod` replaces `environment.ts` with `environment.prod.ts`.
// The list of file replacements can be found in `angular.json`.

export const environment: EnvironmentData = {
  debugMode: true,
  environmentName: 'DEV',
  fuseBaseUrl: 'https://servicesdev.valassislab.com/services/',
  production: false,
  esri: {
    portalServer: 'https://vallomimpor1vm.val.vlss.local/',
    username: 'impower5',
    password: 'impower123!'
  },
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
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/WRAP_Top_Vars_Very_Simplified/FeatureServer/0'
    }
  },
  portalUrl: 'https://gis.valassislab.com',
};
