import { LogLevels } from '@val/common';
import { AllLayerIds } from '@val/esri';

export const environment = {
  production: true,
  serverBuild: true,
  logLevel: LogLevels.ERROR
};

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'PROD';

  // OAuth information
  public static clientId = 'seUTFCqmugdQFDOyznekLaHmFoAa';
  public static clientSecret = '_QZJSLshNo8N590wXfQzsngSZika';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = false;

  // this variable controls whether a user is currently authenticated
  // this *MUST* be set to false for all environments other than local
  public static authenticated = false;

  public static fuseBaseUrl = 'https://services.valassis.com/services/';
  public static impowerBaseUrl = 'https://impowerdev.val.vlss.local/';

  public static esri = {
    portalServer:  'https://valvcsimpor1vm.val.vlss.local/',
    userName: 'quickmaps',
    password: 'quickmaps123'
  };

  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: '3c9cc326b95e4521bed397b5c2dfdc33',
      centroid: undefined
    },
    counties: {
      boundary: '78dfd4524abd4665840ec898c03bc88e',
      centroid: undefined
    },
    zip: {
      boundary: 'b1d2b37add4d470ca32bfd9f40d91b9f',
      centroid: 'f0dd4c98bd3843c2b7ed16f04040ff13'
    },
    atz: {
      boundary: 'dac5cea6976a42ceb3f0498d2c901447',
      centroid: '7bde296c08254ed78460accd00c8af49'
    },
    dtz: {
      boundary: '9230ad1f421847f08d6bf0ae2f8ba00f',
      centroid: 'ae57986ce91144e98a65208ef8ae5a1d'
    },
    pcr: {
      boundary: '2fe987a3c8b74c18a719433e69644bb0',
      centroid: '8ac8074ac3c44d91bce4271928ac7e20'
    },
    wrap: {
      boundary: '8dbaa84192c94b5eab3f4e685ba93af7',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`,
    valPrintService : `${EnvironmentData.esri.portalServer}arcgis-server2/rest/services/CurrentMapView/GPServer/CurrentMapView`

  };
}
