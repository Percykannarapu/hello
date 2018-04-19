export const environment = {
  production: true
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
    portalUrl:  'https://valvcsimpor1vm.val.vlss.local/'
  };
  public static esriIdentityAuth = {
    generatorUrl: `${EnvironmentData.esri.portalUrl}arcgis/sharing/rest/generateToken`,
    tokenServerUrl: `${EnvironmentData.esri.portalUrl}arcgis/sharing/rest/portals`,
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
        minScale: 5000000,
        popUpFields: ['objectid', 'gdt_id', 'county_nam', 'state_abbr', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long', 'SHAPE.AREA', 'SHAPE.LEN']
      }
    },
    dma: {
      boundaries: { // DMA_Boundaries
        id: '3c9cc326b95e4521bed397b5c2dfdc33',
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
        minScale: undefined,
        popUpFields: ['objectid', 'dma_code', 'dma_name', 'dma_area', 'cent_lat', 'cent_long']
      }
    },
    zip: {
      centroids: { // ZIP_Centroids
        id: 'f0dd4c98bd3843c2b7ed16f04040ff13',
        name: 'ZIP Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 1155600,
        popUpFields: []
      },
      topVars: { // ZIP Top Vars
        id: 'b1d2b37add4d470ca32bfd9f40d91b9f',
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 1155600,
        popUpFields: ['city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    atz: {
      centroids: { // ATZ_Centroids
        id: '7bde296c08254ed78460accd00c8af49',
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 1155600,
        popUpFields: []
      },
      topVars: { // ATZ_Top_Vars
        id: 'dac5cea6976a42ceb3f0498d2c901447',
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 1155600,
        popUpFields: ['city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    digital_atz: {
      digitalCentroids: { // DIG_ATZ_Centroids
        id: 'ae57986ce91144e98a65208ef8ae5a1d',
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 577790,
        popUpFields: []
      },
      digitalTopVars: { // DIG_ATZ_Top_Vars
        id: '9230ad1f421847f08d6bf0ae2f8ba00f',
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 600000,
        popUpFields: ['city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
      }
    },
    pcr: {
      centroids: {
        id: '8ac8074ac3c44d91bce4271928ac7e20',
        name: 'PCR Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
        minScale: 577790, // turn on at scale level 10
        popUpFields: []
      },
      topVars: {
        id: '2fe987a3c8b74c18a719433e69644bb0',
        name: 'PCR Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 600000,
        popUpFields: [ 'city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    wrap: {
      topVars: { // WRAP_Top_Vars
        id: '8dbaa84192c94b5eab3f4e685ba93af7',
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
        minScale: 5000000,
        popUpFields: ['city_name', 'dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00' ]
      }
    },
    hh: {
      vt: {  // vt layer
        id: undefined,
        name: '',
        defaultVisibility: true,
        popupTitleSuffix: '',
        minScale: undefined,
      },
      source: { // source feature layer
        id: undefined,
        name: '',
        defaultVisibility: true,
        popupTitleSuffix: '',
        minScale: undefined,
      }
    }
  };
}
