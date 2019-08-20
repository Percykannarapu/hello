// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

import { LogLevels } from '@val/common';
import { AllLayerIds } from '@val/esri';

export const environment = {
  production: false,
  serverBuild: false,
  logLevel: LogLevels.INFO
};

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'LOCAL';

  // OAuth information
  public static clientId = 'seUTFCqmugdQFDOyznekLaHmFoAa';
  public static clientSecret = '_QZJSLshNo8N590wXfQzsngSZika';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = true;

  // this variable controls whether a user is currently authenticated
  // this must be set to false now for local environments so we get an OAUTH token
  public static authenticated = false;

  public static fuseBaseUrl = 'http://localhost:8181/cxf/services/';
  //public static fuseBaseUrl = 'https://servicesdev.valassislab.com/services/';
  public static impowerBaseUrl = 'https://impowerdev.val.vlss.local/';

  public static esri = {
    portalServer:  'https://vallomimpor1vm.val.vlss.local/',
    userName: 'admin',
    password: 'password'
  };

  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: '5c8d7e4a824f4aa0b254925348f2a14a',
      centroid: undefined
    },
    counties: {
      boundary: '39b51d9d498f4107bc69ac30f31ac115',
      centroid: undefined
    },
    zip: {
      boundary: '23a54308e914496aa24d94a9b36776a0',
      centroid: '88120ac630d746239b133296e87b8e1f'
    },
    atz: {
      boundary: 'c0ee701ee95f4bbdbc15ded2a37ca802',
      centroid: 'fd4b078fc2424dd5a48af860dc421431'
    },
    dtz: {
      boundary: 'a4449b3ee55442af881f6ac660ca8163',
      centroid: '377018a24ba14afa9e02e56110b3a568'
    },
    pcr: {
      boundary: '53482efa44914dc199f3833276ddb5a1',
      centroid: 'ab655c84473748159307fe18962138d1'
    },
    wrap: {
      boundary: '12bae62392eb47aeb887b6509da557b5',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`,
    valPrintService : `${EnvironmentData.esri.portalServer}arcgis-server2/rest/services/CurrentMapView/GPServer/CurrentMapView`

  };
}
