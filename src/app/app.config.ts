import { Injectable } from '@angular/core';
import { environment, EnvironmentData } from '../environments/environment';
import {
  EsriAuthenticationParams,
  EsriAuthenticationConfig,
  EsriConfigOptions,
  EsriLoaderConfig,
  EsriAppSettings
} from './esri/configuration';
import { LoggingConfiguration, LogLevels } from './val-modules/common/services/logging.service';
import { AllLayers } from './esri/layer-configuration';

@Injectable()
export class AppConfig implements EsriLoaderConfig, EsriAuthenticationConfig, LoggingConfiguration {

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
    request: {
      timeout: 120000
    },
    dojoConfig: {
      has: {
        // https://blogs.esri.com/esri/arcgis/2017/12/14/making-better-promises/
        // 'esri-promise-compatibility': 1,
        // 2D WebGL setting - https://blogs.esri.com/esri/arcgis/2017/09/29/featurelayer-taking-advantage-of-webgl-2d/
        // 'esri-featurelayer-webgl': 1
      }
    }
  };

  public esriAppSettings: EsriAppSettings = {
    defaultSpatialRef: 4326,
    maxPointsPerBufferQuery: 100,
    maxPointsPerAttributeQuery: 50,
    maxPointsPerServiceQuery: 1000,
    defaultMapParams: {
      layers: []
    },
    defaultViewParams: {
      center: { longitude: -98.5795, latitude: 39.8282 },
      zoom: 4,
      highlightOptions : {
        color: [0, 255, 0],
        fillOpacity: 0.65,
        haloOpacity: 0
      },
      spatialReference: {
        wkid: 102100
      }
    }
  };

   esriAuthParams: EsriAuthenticationParams = {
     generatorUrl: EnvironmentData.esriIdentityAuth.generatorUrl,
     tokenServerUrl: EnvironmentData.esriIdentityAuth.tokenServerUrl,
     userName: EnvironmentData.esriIdentityAuth.userName,
     password: EnvironmentData.esriIdentityAuth.password,
     referer: window.location.origin
   };
   oAuthParams = EnvironmentData.oAuth;

   public valServiceBase = `${EnvironmentData.fuseBaseUrl}`;
   public radDataService = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RAD/GPServer/RAD';
   public maxBufferRadius = 50;
   public maxGeosPerGeoInfoQuery = 400;
   public maxValGeocodingReqSize = 50;
   public maxRadiusTradeAreas = 3;
   //public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';

   public serviceUrls = EnvironmentData.serviceUrls;

   public impowerBaseUrl = EnvironmentData.impowerBaseUrl;

   // Can be used to hide/show debugging info
   public debugMode: boolean = EnvironmentData.debugMode;

  public layers: AllLayers = {
    dma: {
      group: {
        name: 'Valassis DMA'
      },
      boundaries: { // DMA_Boundaries
        id: EnvironmentData.layerIds.dma.boundary,
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
        id: EnvironmentData.layerIds.counties.boundary,
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitle: 'County: {COUNTY_NAM}, {STATE_ABBR}',
        minScale: undefined,
        popUpFields: ['gdt_id', 'county_nam', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long', 'SHAPE.AREA', 'SHAPE.LEN']
      }
    },
    zip: {
      group: {
        name: 'Valassis ZIP',
      },
      centroids: { // ZIP_Centroids
        id: EnvironmentData.layerIds.zip.centroid,
        name: 'ZIP Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ZIP Top Vars
        id: EnvironmentData.layerIds.zip.boundary,
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitle: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language']
        }
      }
    },
    atz: {
      group: {
        name: 'Valassis ATZ',
      },
      centroids: { // ATZ_Centroids
        id: EnvironmentData.layerIds.atz.centroid,
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ATZ_Top_Vars
        id: EnvironmentData.layerIds.atz.boundary,
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitle: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language']
        }
      }
    },
    digital_atz: {
      group: {
        name: 'Valassis Digital ATZ',
      },
      centroids: { // DIG_ATZ_Centroids
        id: EnvironmentData.layerIds.dtz.centroid,
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 577790,
        popUpFields: []
      },
      boundaries: { // DIG_ATZ_Top_Vars
        id: EnvironmentData.layerIds.dtz.boundary,
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        popupTitle: 'Digital ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 577790,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
        }
      }
    },
    pcr: {
      group: {
        name: 'Valassis PCR',
      },
      centroids: {
        id: EnvironmentData.layerIds.pcr.centroid,
        name: 'PCR Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 577790, // turn on at scale level 10
        popUpFields: []
      },
      boundaries: {
        id: EnvironmentData.layerIds.pcr.boundary,
        name: 'PCR Boundaries',
        defaultVisibility: true,
        popupTitle: 'PCR: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 577790,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language']
        }
      }
    },
    wrap: {
      group: {
        name: 'Valassis WRAP'
      },
      boundaries: { // WRAP_Top_Vars
        id: EnvironmentData.layerIds.wrap.boundary,
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 577790,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
      }
    }
  };

  public getLayerIdForAnalysisLevel(analysisLevel: string, boundary: boolean = true) : string {
     console.log('app.config.getLayerIdForAnalysisLevel - analysisLevel: ', analysisLevel);
    switch ((analysisLevel || '').toLowerCase()) {
      case 'zip':
        return boundary ? this.layers.zip.boundaries.id : this.layers.zip.centroids.id;
      case 'atz':
        return boundary ? this.layers.atz.boundaries.id : this.layers.atz.centroids.id;
      case 'digital atz':
        return boundary ? this.layers.digital_atz.boundaries.id : this.layers.digital_atz.centroids.id;
      case 'pcr':
        return boundary ? this.layers.pcr.boundaries.id : this.layers.pcr.centroids.id;
      default:
        throw new Error(`Invalid analysis level '${analysisLevel}' passed into AppConfig::getLayerIdForAnalysisLevel`);
    }
  }

  public webGLIsAvailable() : boolean {
    return this.esriConfig.dojoConfig['has'] && (this.esriConfig.dojoConfig['has']['esri-featurelayer-webgl'] === 1);
  }

}
