import { Injectable } from '@angular/core';
import { IEsriLoaderConfig } from './esri-modules/core/esri-modules.service';
import { IAuthenticationParams } from './services/esri-identity.service';

@Injectable()
export class AppConfig implements IEsriLoaderConfig
{
   esriConfig = {
     url: 'https://js.arcgis.com/4.5/'
     // dojoConfig: {
     //   has: {
     //     'esri-featurelayer-webgl': 1
     //   }
     // }
   };
   localPortalAuthParams: IAuthenticationParams = {
     generatorUrl: 'https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken',
     tokenServerUrl: 'https://valvcshad001vm.val.vlss.local/server/rest/services',
     userName: 'admin',
     password: 'admin123',
     referer: 'http://vallomjbs002vm:8080'
   };
   public valServiceBase = 'https://servicesdev.valassislab.com/services/';

   public layerIds = {
     dma: ['9205b77cd8c74773aefad268b6705543'], // DMA_Boundaries
     zip: [
      '5742f3faba51493ab29f9e78bc5598d4', // ZIP Top Vars
      '38b352fed65640beb0c246b82a24c881'  // ZIP_Centroids_FL
    ],
     atz: [
      'd3bf2b2a2a0a46f5bf10e8c6270767da', // ATZ_Top_Vars
      '6053fb9b971245a6a61c3c20a2495732', // ATZ_Centroids
      '2393d7bb2ac547c4a6bfa3d16f8febaa', // DIG_ATZ_Top_Vars
      '2acb6088bfbb4be1abd502ea3b20ecf6'  // DIG_ATZ_Centroids
    ],
      pcr: [],
      wrap: [
      '09e5cdab538b43a4a6bd9a0d54b682a7'  // WRAP_Top_Vars
    ],
      hh: [
      '837f4f8be375464a8971c56a0856198e', // vt layer
      '5a99095bc95b45a7a830c9e25a389712'  // source featurelayer
    ],
   };
}
