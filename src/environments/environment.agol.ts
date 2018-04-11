export const environment = {
  production: false
};

export interface LayerDefinition {
  id: string;
  name: string;
  defaultVisibility: boolean;
  popupTitleSuffix: string;
  minScale: number;
  popUpFields: string[];
}

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'AGOL';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = false;

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
    counties: {
      boundaries: { // Counties
        id: undefined,
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
        minScale: undefined,
        popUpFields: ['objectid', 'gdt_id', 'county_nam', 'state_abbr', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long', 'SHAPE.AREA', 'SHAPE.LEN']
      }
    },
    dma: {
      boundaries: { // DMA_Boundaries
        id: '9205b77cd8c74773aefad268b6705543',
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
        minScale: undefined,
        popUpFields: ['objectid', 'dma_code', 'dma_name', 'dma_area', 'cent_lat', 'cent_long']
      }
    },
    zip: {
      centroids: { // ZIP_Centroids
        id: '38b352fed65640beb0c246b82a24c881',
        name: 'ZIP Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 1155600,
        popUpFields: []
      },
      topVars: { // ZIP Top Vars
        id: '5742f3faba51493ab29f9e78bc5598d4',
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 1155600,
        popUpFields: []
      }
    },
    atz: {
      centroids: { // ATZ_Centroids
        id: '6053fb9b971245a6a61c3c20a2495732',
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 577790,
        popUpFields: []
      },
      topVars: { // ATZ_Top_Vars
        id: 'd3bf2b2a2a0a46f5bf10e8c6270767da',
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 600000,
        popUpFields: []
      }
    },
    digital_atz: {
      digitalCentroids: { // DIG_ATZ_Centroids
        id: '2acb6088bfbb4be1abd502ea3b20ecf6',
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 577790,
        popUpFields: []
      },
      digitalTopVars: { // DIG_ATZ_Top_Vars
        id: '2393d7bb2ac547c4a6bfa3d16f8febaa',
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 600000,
        popUpFields: []
      }
    },
    pcr: {
      centroids: {
        id: undefined,
        name: 'PCR Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 577790, // turn on at scale level 10
        popUpFields: []
      },
      topVars: {
        id: undefined,
        name: 'PCR Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 600000,
        popUpFields: ['city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    wrap: {
      topVars: { // WRAP_Top_Vars
        id: '09e5cdab538b43a4a6bd9a0d54b682a7',
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 5000000,
        popUpFields: ['city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
      }
    },
    hh: {
      vt: {  // vt layer
        id: '837f4f8be375464a8971c56a0856198e',
        name: 'HH VT',
        defaultVisibility: true,
        popupTitleSuffix: '',
        minScale: undefined,
        popUpFields: []
      },
      source: { // source feature layer
        id: '5a99095bc95b45a7a830c9e25a389712',
        name: 'HH Source',
        defaultVisibility: true,
        popupTitleSuffix: '',
        minScale: undefined,
        popUpFields: []
      }
    }
  };
}
