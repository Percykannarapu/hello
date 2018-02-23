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
  popupTitleSuffix: string;
}

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'DEV';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = true;

  // this variable controls whether a user is currently authenticated
  // this *MUST* be set to false for all environments other than local
  public static authenticated = false;

  public static fuseBaseUrl = 'https://servicesdev.valassislab.com/';
  public static impowerBaseUrl = 'https://impowerdev.val.vlss.local/';

  public static esri = {
    portalUrl:  'https://vallomimpor1vm.val.vlss.local/arcgis/'
  };
  public static esriIdentityAuth = {
    generatorUrl: `${EnvironmentData.esri.portalUrl}sharing/rest/generateToken`,
    tokenServerUrl: `${EnvironmentData.esri.portalUrl}sharing/rest/portals`,
    userName: 'admin',
    password: 'password'
  };
  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds = {
    counties: {
      boundaries: { // Counties
        id: '39b51d9d498f4107bc69ac30f31ac115',
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
      }
    },
    dma: {
      boundaries: { // DMA_Boundaries
        id: '5c8d7e4a824f4aa0b254925348f2a14a',
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {DMA_CODE} - {DMA_NAME}',
      }
    },
    zip: {
      centroids: { // ZIP_Centroids
        id: '88120ac630d746239b133296e87b8e1f',
        name: 'Zip Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      topVars: { // ZIP Top Vars
        id: '23a54308e914496aa24d94a9b36776a0',
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    atz: {
      centroids: { // ATZ_Centroids
        id: 'fd4b078fc2424dd5a48af860dc421431',
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      topVars: { // ATZ_Top_Vars
        id: 'c0ee701ee95f4bbdbc15ded2a37ca802',
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    digital_atz: {
      digitalCentroids: { // DIG_ATZ_Centroids
        id: '377018a24ba14afa9e02e56110b3a568',
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      digitalTopVars: { // DIG_ATZ_Top_Vars
        id: 'a4449b3ee55442af881f6ac660ca8163',
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    pcr: {
      centroids: {
        id: 'ab655c84473748159307fe18962138d1',
        name: 'PCR Centroids',
        defaultVisibility: false,
        popupTitleSuffix: '',
      },
      topVars: {
        id: '53482efa44914dc199f3833276ddb5a1',
        name: 'PCR Boundaries',
        defaultVisibility: true,
        popupTitleSuffix: ': {GEOCODE}',
      }
    },
    wrap: {
      topVars: { // WRAP_Top_Vars
        id: '12bae62392eb47aeb887b6509da557b5',
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
