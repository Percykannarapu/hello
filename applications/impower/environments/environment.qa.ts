import { LogLevels } from '../app/val-modules/common/services/logging.service';
import { AllLayerIds } from '@val/esri';

export const environment = {
  production: true,
  logLevel: LogLevels.WARN
};

export class EnvironmentData {

  // The name of the environment
  public static environmentName = 'QA';

  // OAuth information
  public static clientId = 'cm246JqFF4EU5rbBlkftIf6olI8a';
  public static clientSecret = 'MnfaK8NczJl884o0DpxRKWG0D_Ua';

  // Can be used to hide/show debugging info
  public static debugMode: boolean = false;

  // this variable controls whether a user is currently authenticated
  // this *MUST* be set to false for all environments other than local
  public static authenticated = false;

  public static fuseBaseUrl = 'https://vallomwso002vm.val.vlss.local:8243/services-qa/';
  //public static fuseBaseUrl = 'https://services.valassislab.com/services/';
  public static impowerBaseUrl = 'https://impowerqa.val.vlss.local/';

  public static esri = {
    portalServer:  'https://vallomimpor1vm.val.vlss.local/',
    userName: 'admin',
    password: 'password'
  };

  public static oAuth = {
    registerUrl: `${EnvironmentData.impowerBaseUrl}oauth/register`,
    tokenUrl: `${EnvironmentData.impowerBaseUrl}oauth/token`
  };

  public static layerIds: AllLayerIds = {
    dma: {
      boundary: '5c8d7e4a824f4aa0b254925348f2a14a',
      centroid: undefined
    },
    counties: {
      boundary: '39b51d9d498f4107bc69ac30f31ac115',
      centroid: undefined
    },
    zip: {
      boundary: '23a54308e914496aa24d94a9b36776a0',
      centroid: '88120ac630d746239b133296e87b8e1f'
    },
    atz: {
      boundary: 'c0ee701ee95f4bbdbc15ded2a37ca802',
      centroid: 'fd4b078fc2424dd5a48af860dc421431'
    },
    dtz: {
      boundary: 'a4449b3ee55442af881f6ac660ca8163',
      centroid: '377018a24ba14afa9e02e56110b3a568'
    },
    pcr: {
      boundary: '53482efa44914dc199f3833276ddb5a1',
      centroid: 'ab655c84473748159307fe18962138d1'
    },
    wrap: {
      boundary: '12bae62392eb47aeb887b6509da557b5',
      centroid: undefined
    }
  };

  public static serviceUrls = {
    homeGeocode: `${EnvironmentData.esri.portalServer}arcgis-server/rest/services/HomeGeocode/GPServer/HomeGeocode`
  };
}