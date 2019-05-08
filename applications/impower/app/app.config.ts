import { Inject, Injectable } from '@angular/core';
import { LogLevels } from '@val/common';
import { environment, EnvironmentData } from '../environments/environment';
import { AllLayers, EsriLoaderToken, EsriConfigOptions } from '@val/esri';
import { LoggingConfiguration } from './val-modules/common/services/logging.service';

@Injectable()
export class AppConfig implements LoggingConfiguration {

  constructor(@Inject(EsriLoaderToken) private esriSettings: EsriConfigOptions) {}

  // The name of the environment
  public environmentName = EnvironmentData.environmentName;

  // The log level
  logLevel: LogLevels = environment.logLevel;

  // OAuth information
  public clientId = EnvironmentData.clientId;
  public clientSecret = EnvironmentData.clientSecret;

  // This controls whether or not the user is currently authenticated and will have to log in
  public authenticated: boolean = EnvironmentData.authenticated;

   oAuthParams = EnvironmentData.oAuth;

   public valServiceBase = `${EnvironmentData.fuseBaseUrl}`;
   public radDataService = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RAD/GPServer/RAD';
   public maxBufferRadius = 50;
   public maxGeosPerGeoInfoQuery = 400;
   public maxValGeocodingReqSize = 50;
   public maxRadiusTradeAreas = 3;
   public geoInfoQueryChunks = 5;        // Number of chunks the geos will be split into for multi threading
   //public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';

   public serviceUrls = EnvironmentData.serviceUrls;

   public impowerBaseUrl = EnvironmentData.impowerBaseUrl;

   // Can be used to hide/show debugging info
   public debugMode: boolean = EnvironmentData.debugMode;

  public layers: AllLayers = {
    dma: {
      group: {
        name: 'Valassis DMA',
        sortOrder: 0
      },
      boundaries: { // DMA_Boundaries
        id: EnvironmentData.layerIds.dma.boundary,
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitle: 'DMA: {DMA_CODE}&nbsp;&nbsp;&nbsp;&nbsp;{DMA_NAME}',
        minScale: undefined,
        popUpFields: ['dma_name', 'dma_area', 'cent_lat', 'cent_long'],
        labelExpression: '$feature.dma_code',
        labelFontSizeOffset: 6
      }
    },
    counties: {
      group: {
        name: 'Counties',
        sortOrder: 1
      },
      boundaries: { // Counties
        id: EnvironmentData.layerIds.counties.boundary,
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitle: 'County: {COUNTY_NAM}, {STATE_ABBR}',
        minScale: undefined,
        popUpFields: ['gdt_id', 'county_nam', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long', 'SHAPE.AREA', 'SHAPE.LEN'],
        labelExpression: 'TEXT($feature.state_fips, "00") + TEXT($feature.county_fip, "000") + TextFormatting.NewLine + $feature.county_nam',
        labelFontSizeOffset: 4
      }
    },
    wrap: {
      group: {
        name: 'Valassis WRAP',
        sortOrder: 2
      },
      boundaries: { // WRAP_Top_Vars
        id: EnvironmentData.layerIds.wrap.boundary,
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 4622342,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00'],
        labelExpression: '$feature.geocode',
        labelFontSizeOffset: 2
      }
    },
    zip: {
      group: {
        name: 'Valassis ZIP',
        sortOrder: 3
      },
      centroids: { // ZIP_Centroids
        id: EnvironmentData.layerIds.zip.centroid,
        name: 'ZIP Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: [],
        labelExpression: null
      },
      boundaries: { // ZIP Top Vars
        id: EnvironmentData.layerIds.zip.boundary,
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language']
        },
        labelExpression: '$feature.geocode',
        labelFontSizeOffset: 2
      }
    },
    atz: {
      group: {
        name: 'Valassis ATZ',
        sortOrder: 4
      },
      centroids: { // ATZ_Centroids
        id: EnvironmentData.layerIds.atz.centroid,
        name: 'ATZ Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: [],
        labelExpression: null
      },
      boundaries: { // ATZ_Top_Vars
        id: EnvironmentData.layerIds.atz.boundary,
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language']
        },
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")',
        labelColorOverride: { a: 1, r: 51, g: 59, b: 103 }
      }
    },
    digital_atz: {
      group: {
        name: 'Valassis Digital ATZ',
        sortOrder: 5
      },
      centroids: { // DIG_ATZ_Centroids
        id: EnvironmentData.layerIds.dtz.centroid,
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 577790,
        popUpFields: [],
        labelExpression: null
      },
      boundaries: { // DIG_ATZ_Top_Vars
        id: EnvironmentData.layerIds.dtz.boundary,
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'Digital ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 577790,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
        },
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")',
        labelColorOverride: { a: 1, r: 51, g: 59, b: 103 }
      }
    },
    pcr: {
      group: {
        name: 'Valassis PCR',
        sortOrder: 6
      },
      centroids: {
        id: EnvironmentData.layerIds.pcr.centroid,
        name: 'PCR Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 577790, // turn on at scale level 10
        popUpFields: [],
        labelExpression: null
      },
      boundaries: {
        id: EnvironmentData.layerIds.pcr.boundary,
        name: 'PCR Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'PCR: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 577790,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00', 'language']
        },
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")',
        labelColorOverride: { a: 1, r: 51, g: 59, b: 103 }
      }
    }
  };

  public getLayerIdForAnalysisLevel(analysisLevel: string, boundary: boolean = true) : string {
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
}
