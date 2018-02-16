// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build --env=prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular-cli.json`.

export const environment = {
  production: false
};

export class EnvironmentData {
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
    dma: {
      boundaries: '5c8d7e4a824f4aa0b254925348f2a14a', // DMA_Boundaries
      counties: '39b51d9d498f4107bc69ac30f31ac115'  // Counties
    },
    zip: {
      topVars: '23a54308e914496aa24d94a9b36776a0', // ZIP Top Vars
      centroids: '88120ac630d746239b133296e87b8e1f'  // ZIP_Centroids
    },
    atz: {
      topVars: 'c0ee701ee95f4bbdbc15ded2a37ca802', // ATZ_Top_Vars
      centroids: 'fd4b078fc2424dd5a48af860dc421431' // ATZ_Centroids
    },
    digital_atz: {
      digitalTopVars: 'a4449b3ee55442af881f6ac660ca8163', // DIG_ATZ_Top_Vars
      digitalCentroids: '377018a24ba14afa9e02e56110b3a568'  // DIG_ATZ_Centroids
    },
    pcr: {
      pcr: '8fee65ffdb784c67b76c356e9c26605f'
    },
    wrap: {
      topVars: 'cde7f5d605bf48c4a74b0cd1a47ceccb'  // WRAP_Top_Vars
    },
    hh: {
      vt: undefined, // vt layer
      source: undefined  // source featurelayer
    }
  };
}
