// The file contents for the current environment will overwrite these during build.
// The build system defaults to the dev environment which uses `environment.ts`, but if you do
// `ng build -c prod` then `environment.prod.ts` will be used instead.
// The list of which env maps to which file can be found in `angular.json`
// in the projects->esri-angular-first-look->architect->build->configurations section.

/*
 * In development mode, to ignore zone related error stack frames such as
 * `zone.run`, `zoneDelegate.invokeTask` for easier debugging, you can
 * import the following file, but please comment it out in production mode
 * because it will have performance impact when throw error
 */
import 'zone.js/dist/zone-error'; // Included with Angular CLI.
import { LogLevels } from '@val/common';
import { AllLayerIds } from '@val/esri';

export const environment = {
  production: false,
  serverBuild: false,
  logLevel: LogLevels.DEBUG
};

export class EnvironmentData {
  // The name of the environment
  public static environmentName = 'LOCAL';

  // OAuth information
  public static clientId = 'seUTFCqmugdQFDOyznekLaHmFoAa';
  public static clientSecret = '_QZJSLshNo8N590wXfQzsngSZika';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = true;

  // this variable controls whether a user is currently authenticated
  // this *MUST* be set to false for all environments other than local
  public static authenticated = true;

  //public static fuseBaseUrl = 'https://services.valassislab.com/services/';
  // public static fuseBaseUrl = 'https://vallomwso002vm.val.vlss.local:8243/services/';
  public static fuseBaseUrl = 'https://services.valassislab.com/services/';
  public static impowerBaseUrl = 'http://localhost:4200/';

  public static esri = {
    portalServer:  'https://gis.valassislab.com/',
    userName: 'impower5',
    password: 'impower123!'
  };

  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/DMA_Boundaries_Portal_CopyAllData/FeatureServer`,
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    counties: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/County_Boundaries_Portal_CopyAllData/FeatureServer`,
      simplifiedBoundary: undefined,
      centroid: undefined
    },
    zip: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_CopyAllData/FeatureServer`,
      simplifiedBoundary: 'a73b8263dd5b49efbf3826d120a73f62',
      centroid: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/ZIP_Centroids_CopyAllData/FeatureServer`
    },
    atz: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_CopyAllData/FeatureServer`,
      simplifiedBoundary: 'cfb386fa58944550b0a5c7f76fbab111',
      centroid: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/ATZ_Centroids_CopyAllData/FeatureServer`
    },
    dtz: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/DIG_ATZ_Top_Vars_CopyAllData/FeatureServer`,
      simplifiedBoundary: undefined,
      centroid: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/DIG_ATZ_Centroids_CopyAllData/FeatureServer`
    },
    pcr: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/PCR_Top_Vars_Portal_CopyAllData/FeatureServer`,
      simplifiedBoundary: 'b2b002057e714a73b7760f4a4511534a',
      centroid: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/PCR_Centroids_Portal_CopyAllData/FeatureServer`
    },
    wrap: {
      boundary: `${EnvironmentData.esri.portalServer}/arcgis-server/rest/services/Hosted/WRAP_Top_Vars_Portal_Copy_All_Data/FeatureServer`,
      simplifiedBoundary: 'de4c03f1d5964e64828465558c14b893',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`,
    valPrintService : `https://valvcsimpor1vm.val.vlss.local/arcgis-server2/rest/services/PrintLayout/GPServer/Print%20Layout`,
    batchPrintService: `${EnvironmentData.fuseBaseUrl}v1/impower/print`

  };
}
