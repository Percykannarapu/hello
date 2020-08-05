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

  public static fuseBaseUrl = 'https://services.valassis.com/impower/services/';
  public static impowerBaseUrl = 'https://impower.val.vlss.local/';
  public static printServiceUrl = 'https://impowerpdf.valassisdigital.net';

  public static esri = {
    portalServer:  process.env.ESRI_PORTAL_SERVER,
    userName: process.env.ESRI_USERNAME,
    password: process.env.ESRI_PASSWORD
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: '3c9cc326b95e4521bed397b5c2dfdc33',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    counties: {
      boundary: '78dfd4524abd4665840ec898c03bc88e',
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    zip: {
      boundary: 'b1d2b37add4d470ca32bfd9f40d91b9f',
      simplifiedBoundary: '5432ed92099648b18e3b28d244492324',
      centroid: 'f0dd4c98bd3843c2b7ed16f04040ff13'
    },
    atz: {
      boundary: 'dac5cea6976a42ceb3f0498d2c901447',
      simplifiedBoundary: '5ba6eb49c71b475dbaa45783087a666b',
      centroid: '7bde296c08254ed78460accd00c8af49'
    },
    dtz: {
      boundary: '9230ad1f421847f08d6bf0ae2f8ba00f',
      simplifiedBoundary: undefined,
      centroid: 'ae57986ce91144e98a65208ef8ae5a1d'
    },
    pcr: {
      boundary: '2fe987a3c8b74c18a719433e69644bb0',
      simplifiedBoundary: '60b63871c250465e9071dffa167ed3f3',
      centroid: '8ac8074ac3c44d91bce4271928ac7e20'
    },
    wrap: {
      boundary: '8dbaa84192c94b5eab3f4e685ba93af7',
      simplifiedBoundary: '24c5bebecda14aed940504f8fda63e51',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`,
    valPrintService : `${EnvironmentData.esri.portalServer}arcgis-server2/rest/services/PrintCurrentView/GPServer/PrintCurrentView`,
    batchPrintService: `${EnvironmentData.fuseBaseUrl}v1/impower/print`

  };
}
