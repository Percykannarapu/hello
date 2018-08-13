import { Injectable } from '@angular/core';
import { AuthenticationParams } from './services/esri-identity.service';
import { environment, EnvironmentData } from '../environments/environment';
import { EsriConfigOptions, EsriLoaderConfig } from './esri-modules/configuration';
import { LoggingConfiguration, LogLevels } from './val-modules/common/services/logging.service';

@Injectable()
export class AppConfig implements EsriLoaderConfig, LoggingConfiguration {

  // The name of the environment
  public environmentName = EnvironmentData.environmentName;

  // The log level
  logLevel: LogLevels = environment.logLevel;

  // OAuth information
  public clientId = EnvironmentData.clientId;
  public clientSecret = EnvironmentData.clientSecret;

  // This controls whether or not the user is currently authenticated and will have to log in
  public authenticated: boolean = EnvironmentData.authenticated;

  public esriConfig: EsriConfigOptions = {
    url: 'https://js.arcgis.com/4.8/',
    portalUrl:  `${EnvironmentData.esri.portalUrl}arcgis/`,
    dojoConfig: {
      has: {
        // https://blogs.esri.com/esri/arcgis/2017/12/14/making-better-promises/
        // 'esri-promise-compatibility': 1,
        // 2D WebGL setting - https://blogs.esri.com/esri/arcgis/2017/09/29/featurelayer-taking-advantage-of-webgl-2d/
        // 'esri-featurelayer-webgl': 1
      }
    },
    defaultSpatialRef: 4326,
    maxPointsPerBufferQuery: 25,
    maxPointsPerAttributeQuery: 50
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

   public val_spatialReference = this.esriConfig.defaultSpatialRef;
   public valServiceBase = `${EnvironmentData.fuseBaseUrl}`;
   public radDataService = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RAD/GPServer/RAD';
   public maxBufferRadius = 50;
   public maxGeosPerGeoInfoQuery = 400;
   public maxValGeocodingReqSize = 50;
   public maxRadiusTradeAreas = 3;
   //public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';

   public layerIds = EnvironmentData.layerIds;

   public impowerBaseUrl = EnvironmentData.impowerBaseUrl;

   // Can be used to hide/show debugging info
   public debugMode: boolean = EnvironmentData.debugMode;

   public webGLIsAvailable: () => boolean = () => this.esriConfig.dojoConfig['has'] && (this.esriConfig.dojoConfig['has']['esri-featurelayer-webgl'] === 1);

  public getLayerIdForAnalysisLevel(analysisLevel: string, boundary: boolean = true) : string {
     console.log('app.config.getLayerIdForAnalysisLevel - analysisLevel: ', analysisLevel);
    switch ((analysisLevel || '').toLowerCase()) {
      case 'zip':
        return boundary ? this.layerIds.zip.boundaries.id : this.layerIds.zip.centroids.id;
      case 'atz':
        return boundary ? this.layerIds.atz.boundaries.id : this.layerIds.atz.centroids.id;
      case 'digital atz':
        return boundary ? this.layerIds.digital_atz.boundaries.id : this.layerIds.digital_atz.centroids.id;
      case 'pcr':
        return boundary ? this.layerIds.pcr.boundaries.id : this.layerIds.pcr.centroids.id;
      default:
        throw new Error(`Invalid analysis level '${analysisLevel}' passed into AppConfig::getLayerIdForAnalysisLevel`);
    }
  }
}
