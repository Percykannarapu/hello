// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build -c prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular.json`
// in the projects->impower->architect->build->configurations section.

import { LogLevels } from '@val/common';
import { AllLayerIds } from '@val/esri';

export const environment = {
  production: false,
  serverBuild: false,
  logLevel: LogLevels.DEBUG,
  sanitizeActions: false,
  sanitizeState: false,
};

export class EnvironmentData {
  // The name of the environment
  public static environmentName = 'DEV';

  public static fuseBaseUrl = 'https://impowerdev.valassis.com/services/';
  public static impowerBaseUrl = 'http://localhost:4200/';
  public static printServiceUrl = 'https://impowerpdf.test.valassisdigital.net';

  public static esri = {
    portalServer:  process.env.ESRI_PORTAL_SERVER,
    userName: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: '5c8d7e4a824f4aa0b254925348f2a14a',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    counties: {
      boundary: '39b51d9d498f4107bc69ac30f31ac115',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    zip: {
      boundary: '23a54308e914496aa24d94a9b36776a0',
      simplifiedBoundary: 'fb4295cfef1743f9a8a12c1d444effeb',
      centroid: '88120ac630d746239b133296e87b8e1f'
    },
    atz: {
      boundary: 'c0ee701ee95f4bbdbc15ded2a37ca802',
      simplifiedBoundary: '269894235d7946d19500e4bbf3ea9b09',
      centroid: 'fd4b078fc2424dd5a48af860dc421431'
    },
    dtz: {
      boundary: 'a4449b3ee55442af881f6ac660ca8163',
      simplifiedBoundary: '0dff970830cb4b14b58596a57e7f1518',
      centroid: '377018a24ba14afa9e02e56110b3a568'
    },
    pcr: {
      boundary: '53482efa44914dc199f3833276ddb5a1',
      simplifiedBoundary: 'b2b002057e714a73b7760f4a4511534a',
      centroid: 'ab655c84473748159307fe18962138d1'
    },
    wrap: {
      boundary: '12bae62392eb47aeb887b6509da557b5',
      simplifiedBoundary: 'f9594a876236492dab4bb667c28e18a5',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`,
    valPrintService : `${EnvironmentData.esri.portalServer}arcgis-server2/rest/services/PrintCurrentView/GPServer/PrintCurrentView`,
    batchPrintService: `${EnvironmentData.fuseBaseUrl}v1/impower/print`
  };
}
