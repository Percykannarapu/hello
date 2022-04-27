import { LogLevels } from '@val/common';
import { AllLayerIds } from '@val/esri';
import { serverEnv } from './server-urls';

export const environment = {
  production: true,
  serverBuild: true,
  logLevel: LogLevels.WARN,
  sanitizeActions: false,
  sanitizeState: true,
};

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'QA';

  public static fuseBaseUrl = serverEnv.middlewareBase;
  public static impowerBaseUrl = 'https://impowerqa.valassis.com/';
  public static printServiceUrl = 'https://impowerpdf-dev.valassisdigital.net';

  public static esri = {
    portalServer:  'https://impowerqa.valassis.com/',
    userName: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  };

  public static layerIds: AllLayerIds = {
    state: {
      boundary: '99fd67933e754a1181cc755146be21ca',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    dma: {
      boundary: '423fa5dd0d824080b4026dbce6752e02',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    counties: {
      boundary: '4f6b219aabca46beb9f03add5f7e54d1',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    zip: {
      boundary: '28ab27c41d214e7e83a4f05372c7f387',
      simplifiedBoundary: '47817fd990cc40e28b6bec5ff1fb7ac5',
      centroid: '1be0a79bf27b46ce82cf459fd70c1bad'
    },
    atz: {
      boundary: '9918dff6c1b34b139cb00bc3561ad81a',
      simplifiedBoundary: 'f9b657116f8c4a5a855de601f012e16e',
      centroid: 'b58a024badbc4b63bce258aceaab7f31'
    },
    dtz: {
      boundary: '5e81da421ebf402e98d64622f84b3603',
      simplifiedBoundary: undefined,
      centroid: 'e44e37afe10d4145b5e09d1a9027003b'
    },
    pcr: {
      boundary: '80b9f78d11ea49d6a325375d47c946bc',
      simplifiedBoundary: undefined,
      centroid: 'a4a8221c2c9b453ca84acbc8cb31df5c'
    },
    wrap: {
      boundary: '7fa52ae91fb047519a7e3e1651d91b1b',
      simplifiedBoundary: 'ba378a55b58647b7ba2ee2fedea1adad',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`,
    valPrintService : `${EnvironmentData.esri.portalServer}arcgis-server2/rest/services/PrintCurrentView/GPServer/PrintCurrentView`,
    batchPrintService: `${EnvironmentData.fuseBaseUrl}v1/impower/print`
  };

  // old portal Id: new portal Id
  public static portalIdUpdates = {
    // zip
    '23a54308e914496aa24d94a9b36776a0': EnvironmentData.layerIds.zip.boundary,
    '88120ac630d746239b133296e87b8e1f': EnvironmentData.layerIds.zip.centroid,
    'fb4295cfef1743f9a8a12c1d444effeb': EnvironmentData.layerIds.zip.simplifiedBoundary,
    // atz
    'c0ee701ee95f4bbdbc15ded2a37ca802': EnvironmentData.layerIds.atz.boundary,
    'fd4b078fc2424dd5a48af860dc421431': EnvironmentData.layerIds.atz.centroid,
    '269894235d7946d19500e4bbf3ea9b09': EnvironmentData.layerIds.atz.simplifiedBoundary,
    // dtz
    'a4449b3ee55442af881f6ac660ca8163': EnvironmentData.layerIds.dtz.boundary,
    '377018a24ba14afa9e02e56110b3a568': EnvironmentData.layerIds.dtz.centroid,
    '0dff970830cb4b14b58596a57e7f1518': EnvironmentData.layerIds.dtz.boundary, // TODO: Update when we get a real simplified boundary
    // pcr
    '53482efa44914dc199f3833276ddb5a1': EnvironmentData.layerIds.pcr.boundary,
    'ab655c84473748159307fe18962138d1': EnvironmentData.layerIds.pcr.centroid,
    'b2b002057e714a73b7760f4a4511534a': EnvironmentData.layerIds.pcr.boundary, // TODO: Update when we get a real simplified boundary
    // dma
    '5c8d7e4a824f4aa0b254925348f2a14a': EnvironmentData.layerIds.dma.boundary,
    // county
    '39b51d9d498f4107bc69ac30f31ac115': EnvironmentData.layerIds.counties.boundary,
    'dba9d6282fd24e29b40445c3c05be500': EnvironmentData.layerIds.counties.boundary,
    // wrap
    '12bae62392eb47aeb887b6509da557b5': EnvironmentData.layerIds.wrap.boundary,
    'f9594a876236492dab4bb667c28e18a5': EnvironmentData.layerIds.wrap.simplifiedBoundary,
  };
}
