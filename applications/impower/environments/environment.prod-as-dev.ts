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
  public static printServiceUrl = 'https://impowerpdf.valassisdigital.net';

  public static esri = {
    portalServer:  process.env.ESRI_PORTAL_SERVER,
    userName: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: '7fa18dcf1b934ff3bd6137b209d1faf0',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    counties: {
      boundary: '1f68c98ed4d44156a65f1a61e80fbf5a',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    zip: {
      boundary: '3e2a4a9836864cfca10d87d0160d2697',
      simplifiedBoundary: 'da6a828d6bef47958e80e23522ff3727',
      centroid: '89cac0a2c866482b9d4e934105f445a2'
    },
    atz: {
      boundary: 'fedd50a5759c45ccb41edd96713628f9',
      simplifiedBoundary: 'a975f431a654437e891a2a534e805894',
      centroid: '9f56b26cf3ea4b93bc65cb90f831cf24'
    },
    dtz: {
      boundary: 'a0927bb2fb064544beb2813556f8619b',
      simplifiedBoundary: undefined,
      centroid: '763c31ada0db4d09831edb2d19780c2d'
    },
    pcr: {
      boundary: '53b17d3b6de5403889dba73fa767f8ec',
      simplifiedBoundary: undefined,
      centroid: 'c55883ee9dca4bcfa9651c30d4945096'
    },
    wrap: {
      boundary: '02029682807247bd956f3667d949ffa5',
      simplifiedBoundary: 'f187a7ead28d4bea8aea432d9211b06f',
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
    'b1d2b37add4d470ca32bfd9f40d91b9f': EnvironmentData.layerIds.zip.boundary,
    'f0dd4c98bd3843c2b7ed16f04040ff13': EnvironmentData.layerIds.zip.centroid,
    '5432ed92099648b18e3b28d244492324': EnvironmentData.layerIds.zip.simplifiedBoundary,
    // atz
    'dac5cea6976a42ceb3f0498d2c901447': EnvironmentData.layerIds.atz.boundary,
    '7bde296c08254ed78460accd00c8af49': EnvironmentData.layerIds.atz.centroid,
    '5ba6eb49c71b475dbaa45783087a666b': EnvironmentData.layerIds.atz.simplifiedBoundary,
    // dtz
    '9230ad1f421847f08d6bf0ae2f8ba00f': EnvironmentData.layerIds.dtz.boundary,
    'ae57986ce91144e98a65208ef8ae5a1d': EnvironmentData.layerIds.dtz.centroid,
    // dtz did not previously have a simplified layer
    // pcr
    '2fe987a3c8b74c18a719433e69644bb0': EnvironmentData.layerIds.pcr.boundary,
    '8ac8074ac3c44d91bce4271928ac7e20': EnvironmentData.layerIds.pcr.centroid,
    '60b63871c250465e9071dffa167ed3f3': EnvironmentData.layerIds.pcr.boundary, // TODO: Update when we get a real simplified boundary
    // dma
    '3c9cc326b95e4521bed397b5c2dfdc33': EnvironmentData.layerIds.dma.boundary,
    // county
    '78dfd4524abd4665840ec898c03bc88e': EnvironmentData.layerIds.counties.boundary,
    // wrap
    '8dbaa84192c94b5eab3f4e685ba93af7': EnvironmentData.layerIds.wrap.boundary,
    '24c5bebecda14aed940504f8fda63e51': EnvironmentData.layerIds.wrap.simplifiedBoundary,
  };
}
