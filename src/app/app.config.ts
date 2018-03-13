import { Injectable } from '@angular/core';
import { EsriLoaderConfig } from './esri-modules/core/esri-modules.service';
import { AuthenticationParams } from './services/esri-identity.service';
import { EnvironmentData } from '../environments/environment';

@Injectable()
export class AppConfig implements EsriLoaderConfig {

  // The name of the environment
  public environmentName = EnvironmentData.environmentName;

  // This controls whether or not the user is currently authenticated and will have to log in
  public authenticated: boolean = EnvironmentData.authenticated;

   esriConfig = {
     url: 'https://js.arcgis.com/4.5/',
     // Set the hostname to the on-premise portal
     portalUrl:  `${EnvironmentData.esri.portalUrl}arcgis/`,
     /*dojoConfig: {
        has: {
        // https://blogs.esri.com/esri/arcgis/2017/12/14/making-better-promises/
        'esri-promise-compatibility': 1,
        // 2D WebGL setting - https://blogs.esri.com/esri/arcgis/2017/09/29/featurelayer-taking-advantage-of-webgl-2d/
        'esri-featurelayer-webgl': 1
        }
      }*/
   };
   esriIdentityParams: AuthenticationParams = {
     // for valvcshad001vm
     // generatorUrl: 'https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken',
     // tokenServerUrl: 'https://valvcshad001vm.val.vlss.local/server/rest/services',
     // userName: 'admin',
     // password: 'admin123',
     generatorUrl: EnvironmentData.esriIdentityAuth.generatorUrl,
     tokenServerUrl: EnvironmentData.esriIdentityAuth.tokenServerUrl,
     userName: EnvironmentData.esriIdentityAuth.userName,
     password: EnvironmentData.esriIdentityAuth.password,
     referer: window.location.origin
   };
   oAuthParams = EnvironmentData.oAuth;

   public val_spatialReference = 4326; //3857; //4326;
   public valServiceBase = `${EnvironmentData.fuseBaseUrl}services/`;
   public radDataService = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RAD/GPServer/RAD';
   public maxBufferRadius = 50;
   //public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';
   public esriRestApiBase = `${EnvironmentData.esri.portalUrl}arcgis-server/rest/services/Hosted/`;

   public layerIds = EnvironmentData.layerIds;

   public impowerBaseUrl = EnvironmentData.impowerBaseUrl;

   // Can be used to hide/show debugging info
   public debugMode: boolean = EnvironmentData.debugMode;
}
