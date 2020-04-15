import { environment } from '../environments/environment';

export class AppConfig {

   // The name of the environment
   public environmentName = environment.environmentName;

   // The log level

   // OAuth information
   //public clientId = environment.clientId;
   //public clientSecret = EnvironmentData.clientSecret;

   // This controls whether or not the user is currently authenticated and will have to log in
   public authenticated: boolean = true;

   //oAuthParams = EnvironmentData.oAuth;

   public valServiceBase = `${environment.fuseBaseUrl}`;
   public radDataService = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RAD/GPServer/RAD';
   public maxBufferRadius = 50;
   public maxGeosPerGeoInfoQuery = 400;
   public maxValGeocodingReqSize = 50;
   public maxRadiusTradeAreas = 3;
   //Service Url for the Print Widget
   // public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';

   // Service Url for the GP Print Service
   public printServiceUrl = `${environment.portalUrl}/arcgis-server2/rest/services/exportMapBook/GPServer/exportMapBook`;

   //public impowerBaseUrl = EnvironmentData.impowerBaseUrl;

   // Can be used to hide/show debugging info
   public debugMode: boolean = environment.debugMode;

   public ApplicationBusyKey = 'application-level-busy-key';

}
