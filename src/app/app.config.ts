import { Injectable } from '@angular/core';
import { EsriLoaderConfig } from './esri-modules/core/esri-modules.service';
import { AuthenticationParams } from './services/esri-identity.service';

@Injectable()
export class AppConfig implements EsriLoaderConfig
{
   esriConfig = {
     url: 'https://js.arcgis.com/4.5/',
     // Set the hostname to the on-premise portal
     portalUrl:  'https://vallomimpor1vm.val.vlss.local/arcgis/',
     // 2D WebGL setting - https://blogs.esri.com/esri/arcgis/2017/09/29/featurelayer-taking-advantage-of-webgl-2d/
     /*dojoConfig: {
        has: {
          'esri-featurelayer-webgl': 1
        }
      }*/
   };
   localPortalAuthParams: AuthenticationParams = {
     // for valvcshad001vm
     // generatorUrl: 'https://valvcshad001vm.val.vlss.local/portal/sharing/rest/generateToken',
     // tokenServerUrl: 'https://valvcshad001vm.val.vlss.local/server/rest/services',
     // userName: 'admin',
     // password: 'admin123',
     generatorUrl: 'https://vallomimpor1vm.val.vlss.local/arcgis/sharing/rest/generateToken',
     tokenServerUrl: 'https://vallomimpor1vm.val.vlss.local/arcgis/sharing/rest/portals',
     userName: 'admin',
     password: 'password',
     referer: window.location.origin
   };

   AgolAuthParams: AuthenticationParams = {
    generatorUrl: 'https://www.arcgis.com/sharing/generateToken',
    tokenServerUrl: 'https://www.arcgis.com',
    userName: 'amcirillo_vlab2',
    password: 'Password1',
    referer: window.location.origin
    //referer: 'http://localhost:4200'
    //referer: 'https://vallomjbs002vm:8443'
  };

   public valServiceBase = 'https://servicesdev.valassislab.com/services/';
   //public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';

/*
   // AGOL
   public layerIds = {
     dma: { boundaries: '9205b77cd8c74773aefad268b6705543'}, // DMA_Boundaries
     zip: {
      topVars: '5742f3faba51493ab29f9e78bc5598d4', // ZIP Top Vars
      centroids: '38b352fed65640beb0c246b82a24c881'  // ZIP_Centroids_FL
    },
     atz: {
      topVars: 'd3bf2b2a2a0a46f5bf10e8c6270767da', // ATZ_Top_Vars
      centroids: '6053fb9b971245a6a61c3c20a2495732' // ATZ_Centroids
    },
    digital_atz: {
      digitalTopVars: '2393d7bb2ac547c4a6bfa3d16f8febaa', // DIG_ATZ_Top_Vars
      digitalCentroids: '2acb6088bfbb4be1abd502ea3b20ecf6'  // DIG_ATZ_Centroids
    },
      pcr: {},
      wrap: {
      topVars: '09e5cdab538b43a4a6bd9a0d54b682a7'  // WRAP_Top_Vars
    },
      hh: {
      vt: '837f4f8be375464a8971c56a0856198e', // vt layer
      source: '5a99095bc95b45a7a830c9e25a389712'  // source featurelayer
    },
   };
*/
   // QA Server: vallomimpor1vm.val.vlss.local
   public layerIds = {
    dma: {
      boundaries: 'c71cda854feb4e52928d026de9e95741', // DMA_Boundaries
      counties: '80b6a37efae44e1394a9fec1f80e708b'  // Counties
    },
    zip: {
      topVars: '23a54308e914496aa24d94a9b36776a0', // ZIP Top Vars
      centroids: '88120ac630d746239b133296e87b8e1f'  // ZIP_Centroids
    },
    atz: {
      topVars: 'c0ee701ee95f4bbdbc15ded2a37ca802', // ATZ_Top_Vars
      centroids: 'fd4b078fc2424dd5a48af860dc421431\n' // ATZ_Centroids
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
       //'837f4f8be375464a8971c56a0856198e', // vt layer
       //'5a99095bc95b45a7a830c9e25a389712'  // source featurelayer
     },
  };

}
