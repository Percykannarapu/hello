export const environment = {
  production: false
};

export class EnvironmentData {

  // this variable controls whether a user is currently authenticated
  // this *MUST* be set to false for all environments other than local
  public static authenticated = false;

  public static fuseBaseUrl = 'https://servicesdev.valassislab.com/';
  public static impowerBaseUrl = 'https://impowerdev.val.vlss.local/';

  public static esri = {
    portalUrl:  undefined
  };
  public static esriIdentityAuth = {
    generatorUrl: `https://www.arcgis.com/sharing/generateToken`,
    tokenServerUrl: `https://www.arcgis.com`,
    userName: 'amcirillo_vlab2',
    password: 'Password1'
  };
  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds = {
    dma: {
      boundaries: '9205b77cd8c74773aefad268b6705543', // DMA_Boundaries
      counties: undefined  // Counties
    },
    zip: {
      topVars: '5742f3faba51493ab29f9e78bc5598d4', // ZIP Top Vars
      centroids: '38b352fed65640beb0c246b82a24c881'  // ZIP_Centroids
    },
    atz: {
      topVars: 'd3bf2b2a2a0a46f5bf10e8c6270767da', // ATZ_Top_Vars
      centroids: '6053fb9b971245a6a61c3c20a2495732' // ATZ_Centroids
    },
    digital_atz: {
      digitalTopVars: '2393d7bb2ac547c4a6bfa3d16f8febaa', // DIG_ATZ_Top_Vars
      digitalCentroids: '2acb6088bfbb4be1abd502ea3b20ecf6'  // DIG_ATZ_Centroids
    },
    pcr: {
      pcr: undefined
    },
    wrap: {
      topVars: '09e5cdab538b43a4a6bd9a0d54b682a7'  // WRAP_Top_Vars
    },
    hh: {
      vt: '837f4f8be375464a8971c56a0856198e', // vt layer
      source: '5a99095bc95b45a7a830c9e25a389712'  // source featurelayer
    }
  };
}
