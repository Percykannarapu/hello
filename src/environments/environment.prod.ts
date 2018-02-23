export const environment = {
  production: true
};

export interface LayerDefinition {
  id: string;
  name: string;
  defaultVisibility: boolean;
  popupTitleSuffix: string;
}

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'PROD';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = false;

  // this variable controls whether a user is currently authenticated
  // this *MUST* be set to false for all environments other than local
  public static authenticated = false;

  public static fuseBaseUrl = 'https://services.valassislab.com/';
  public static impowerBaseUrl = 'https://impowerdev.val.vlss.local/';

  public static esri = {
    portalUrl:  'https://valvcsimpor1vm.val.vlss.local/arcgis/'
  };
  public static esriIdentityAuth = {
    generatorUrl: `${EnvironmentData.esri.portalUrl}sharing/rest/generateToken`,
    tokenServerUrl: `${EnvironmentData.esri.portalUrl}sharing/rest/portals`,
    userName: 'quickmaps',
    password: 'quickmaps123'
  };
  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds = {
    counties: {
      boundaries: { // Counties
        id: '78dfd4524abd4665840ec898c03bc88e',
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
      }
    },
    dma: {
      boundaries: { // DMA_Boundaries
        id: '3c9cc326b95e4521bed397b5c2dfdc33',
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
      }
    },
    zip: {
      centroids: { // ZIP_Centroids
        id: 'f0dd4c98bd3843c2b7ed16f04040ff13',
        name: 'ZIP Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      topVars: { // ZIP Top Vars
        id: 'b1d2b37add4d470ca32bfd9f40d91b9f',
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    atz: {
      centroids: { // ATZ_Centroids
        id: '7bde296c08254ed78460accd00c8af49',
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      topVars: { // ATZ_Top_Vars
        id: 'dac5cea6976a42ceb3f0498d2c901447',
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    digital_atz: {
      digitalCentroids: { // DIG_ATZ_Centroids
        id: 'ae57986ce91144e98a65208ef8ae5a1d',
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      digitalTopVars: { // DIG_ATZ_Top_Vars
        id: '9230ad1f421847f08d6bf0ae2f8ba00f',
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    pcr: {
      centroids: {
        id: '8ac8074ac3c44d91bce4271928ac7e20',
        name: 'PCR Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      topVars: {
        id: '2fe987a3c8b74c18a719433e69644bb0',
        name: 'PCR Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    wrap: {
      topVars: { // WRAP_Top_Vars
        id: '8dbaa84192c94b5eab3f4e685ba93af7',
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    hh: {
      vt: {  // vt layer
        id: undefined,
        name: '',
        defaultVisibility: true,
        popupTitleSuffix: '',
      },
      source: { // source feature layer
        id: undefined,
        name: '',
        defaultVisibility: true,
        popupTitleSuffix: '',
      }
    }
  };
}
