// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false
};

export interface LayerDefinition {
  id: string;
  name: string;
  defaultVisibility: boolean;
  popupTitle: string;
  minScale: number;
  popUpFields: string[];
}

export interface LayerGroupDefinition {
  group: { name: string };
  centroids?: LayerDefinition;
  boundaries: LayerDefinition;
}

export interface AllLayers {
  [key: string] : LayerGroupDefinition;
}

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

  public static fuseBaseUrl = 'https://vallomwso002vm.val.vlss.local:8243/services/';
  public static impowerBaseUrl = 'https://impowerdev.val.vlss.local/';

  public static esri = {
    portalUrl:  'https://vallomimpor1vm.val.vlss.local/'
  };
  public static esriIdentityAuth = {
    generatorUrl: `${EnvironmentData.esri.portalUrl}arcgis/sharing/rest/generateToken`,
    tokenServerUrl: `${EnvironmentData.esri.portalUrl}arcgis/sharing/rest/portals`,
    userName: 'admin',
    password: 'password'
  };
  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds: AllLayers = {
    dma: {
      group: {
        name: 'Valassis DMA'
      },
      boundaries: { // DMA_Boundaries
        id: '5c8d7e4a824f4aa0b254925348f2a14a',
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitle: 'DMA: {DMA_CODE}&nbsp;&nbsp;&nbsp;&nbsp;{DMA_NAME}',
        minScale: undefined,
        popUpFields: ['dma_name', 'dma_area', 'cent_lat', 'cent_long']
      }
    },
    counties: {
      group: {
        name: 'Counties'
      },
      boundaries: { // Counties
        id: '39b51d9d498f4107bc69ac30f31ac115',
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitle: 'County: {COUNTY_NAM}, {STATE_ABBR}',
        minScale: undefined,
        popUpFields: ['gdt_id', 'county_nam', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long', 'SHAPE.AREA', 'SHAPE.LEN']
      }
    },
    zip: {
      group: {
        name: 'Valassis ZIP'
      },
      centroids: { // ZIP_Centroids
        id: '88120ac630d746239b133296e87b8e1f',
        name: 'ZIP Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ZIP Top Vars
        id: '23a54308e914496aa24d94a9b36776a0',
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitle: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    atz: {
      group: {
        name: 'Valassis ATZ'
      },
      centroids: { // ATZ_Centroids
        id: 'fd4b078fc2424dd5a48af860dc421431',
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ATZ_Top_Vars
        id: 'c0ee701ee95f4bbdbc15ded2a37ca802',
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitle: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    digital_atz: {
      group: {
        name: 'Valassis Digital ATZ'
      },
      centroids: { // DIG_ATZ_Centroids
        id: '377018a24ba14afa9e02e56110b3a568',
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 577790,
        popUpFields: []
      },
      boundaries: { // DIG_ATZ_Top_Vars
        id: 'a4449b3ee55442af881f6ac660ca8163',
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        popupTitle: 'Digital ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 600000,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
      }
    },
    pcr: {
      group: {
        name: 'Valassis PCR'
      },
      centroids: {
        id: 'ab655c84473748159307fe18962138d1',
        name: 'PCR Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 577790, // turn on at scale level 10
        popUpFields: []
      },
      boundaries: {
        id: '53482efa44914dc199f3833276ddb5a1',
        name: 'PCR Boundaries',
        defaultVisibility: true,
        popupTitle: 'PCR: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 600000,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language' ]
      }
    },
    wrap: {
      group: {
        name: 'Valassis WRAP'
      },
      boundaries: { // WRAP_Top_Vars
        id: '12bae62392eb47aeb887b6509da557b5',
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 500000,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
      }
    },
    // hh: {
    //   group: {
    //     name: 'Valassis Households'
    //   },
    //   vt: {  // vt layer
    //     id: undefined,
    //     name: '',
    //     defaultVisibility: true,
    //     popupTitle: '',
    //     minScale: undefined,
    //     popUpFields: []
    //   },
    //   source: { // source feature layer
    //     id: undefined,
    //     name: '',
    //     defaultVisibility: true,
    //     popupTitle: '',
    //     minScale: undefined,
    //     popUpFields: []
    //   }
    // }
  };
}
