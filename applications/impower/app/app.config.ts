import { Inject, Injectable } from '@angular/core';
import { LogLevels } from '@val/common';
import { AllLayers, EsriConfigOptions, EsriLoaderToken, LayerGroupDefinition } from '@val/esri';
import { environment, EnvironmentData } from '../environments/environment';
import { LoggingConfiguration } from './val-modules/common/services/logging.service';

@Injectable()
export class AppConfig implements LoggingConfiguration {

  constructor(@Inject(EsriLoaderToken) private esriSettings: EsriConfigOptions) {}

  // Debug / logging info
  public environmentName = EnvironmentData.environmentName;
  public logLevel: LogLevels = environment.logLevel;

  // Authentication info
  public authenticated: boolean = EnvironmentData.authenticated;
  public clientId = EnvironmentData.clientId;
  public clientSecret = EnvironmentData.clientSecret;
  public oAuthParams = EnvironmentData.oAuth;

  // Urls
  public valServiceBase = `${EnvironmentData.fuseBaseUrl}`;
  public impowerBaseUrl = EnvironmentData.impowerBaseUrl;
  public serviceUrls = EnvironmentData.serviceUrls;

  // Magic numbers
  public maxBufferRadius = 50;
  public maxValGeocodingReqSize = 50;
  public maxRadiusTradeAreas = 3;
  public geoInfoQueryChunks = 5;        // Number of chunks the geos will be split into for multi threading
  public maxGeosForPrecisionZoom = 100;
  public isBatchMode = false;

  // Not used anymore
  // public radDataService = 'https://valvcshad001vm.val.vlss.local/server/rest/services/RAD/GPServer/RAD';
  // public maxGeosPerGeoInfoQuery = 400;
  // public valPrintServiceURL = 'https://vallomimpor1vm.val.vlss.local/arcgis-server/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task';
  // public debugMode: boolean = EnvironmentData.debugMode;

  public basemaps = [
    'streets-vector',
    'streets-navigation-vector',
    'gray-vector',
    'dark-gray-vector',
    'topo-vector',
    'satellite',
    'oceans'
  ];

  public layers: AllLayers = {
    dma: {
      group: {
        name: 'Valassis DMA',
        sortOrder: 0
      },
      boundaries: { // DMA_Boundaries
        id: EnvironmentData.layerIds.dma.boundary,
        simplifiedId: null,
        name: 'DMA Boundaries',
        defaultVisibility: true,
        popupTitle: 'DMA: {DMA_CODE}&nbsp;&nbsp;&nbsp;&nbsp;{DMA_NAME}',
        minScale: undefined,
        popUpFields: ['dma_name', 'dma_area', 'cent_lat', 'cent_long'],
        labelExpression: '$feature.dma_display_name',
        labelFontSizeOffset: 6
      },
      serviceUrl: ''
    },
    counties: {
      group: {
        name: 'Counties',
        sortOrder: 1
      },
      boundaries: { // Counties
        id: EnvironmentData.layerIds.counties.boundary,
        simplifiedId: null,
        name: 'County Boundaries',
        defaultVisibility: true,
        popupTitle: 'County: {COUNTY_NAM}, {STATE_ABBR}',
        minScale: undefined,
        popUpFields: ['gdt_id', 'county_nam', 'state_fips', 'county_fip', 'county_are', 'cent_lat', 'cent_long', 'SHAPE.AREA', 'SHAPE.LEN'],
        labelExpression: 'TEXT($feature.state_fips, "00") + TEXT($feature.county_fip, "000") + TextFormatting.NewLine + $feature.county_nam',
        labelFontSizeOffset: 4
      },
      serviceUrl: ''
    },
    wrap: {
      group: {
        name: 'Valassis WRAP',
        sortOrder: 2
      },
      boundaries: { // WRAP_Top_Vars
        id: EnvironmentData.layerIds.wrap.boundary,
        simplifiedId: EnvironmentData.layerIds.wrap.simplifiedBoundary,
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 4622342,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00'],
        labelExpression: '$feature.wrap_name',
        labelFontSizeOffset: 2
      },
      serviceUrl: ''
    },
    zip: {
      group: {
        name: 'Valassis ZIP',
        sortOrder: 3
      },
      centroids: { // ZIP_Centroids
        id: EnvironmentData.layerIds.zip.centroid,
        simplifiedId: null,
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
        simplifiedId: EnvironmentData.layerIds.zip.simplifiedBoundary,
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
        labelFontSizeOffset: 2,
        labelColorOverride: { a: 1, r: 51, g: 59, b: 103 }
      },
      serviceUrl: 'https://vallomimpor1vm.val.vlss.local/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_CopyAllData/FeatureServer/0'
    },
    atz: {
      group: {
        name: 'Valassis ATZ',
        sortOrder: 4
      },
      centroids: { // ATZ_Centroids
        id: EnvironmentData.layerIds.atz.centroid,
        simplifiedId: null,
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
        simplifiedId: EnvironmentData.layerIds.atz.simplifiedBoundary,
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
      },
      serviceUrl: 'https://vallomimpor1vm.val.vlss.local/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_CopyAllData/FeatureServer/0'
    },
    digital_atz: {
      group: {
        name: 'Valassis Digital ATZ',
        sortOrder: 5
      },
      centroids: { // DIG_ATZ_Centroids
        id: EnvironmentData.layerIds.dtz.centroid,
        simplifiedId: null,
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
        simplifiedId: null,
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
      },
      serviceUrl: ''
    },
    pcr: {
      group: {
        name: 'Valassis PCR',
        sortOrder: 6
      },
      centroids: {
        id: EnvironmentData.layerIds.pcr.centroid,
        simplifiedId: null,
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
        simplifiedId: EnvironmentData.layerIds.pcr.simplifiedBoundary,
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
      },
      serviceUrl: ''
    }
  };

  public getLayerConfigForAnalysisLevel(analysisLevel: string) : LayerGroupDefinition {
    switch ((analysisLevel || '').toLowerCase()) {
      case 'zip':
        return this.layers.zip;
      case 'atz':
        return this.layers.atz;
      case 'digital atz':
        return this.layers.digital_atz;
      case 'pcr':
        return this.layers.pcr;
      default:
        throw new Error(`Invalid analysis level '${analysisLevel}' passed into AppConfig::getLayerConfigForAnalysisLevel`);
    }
  }

  public getLayerIdForAnalysisLevel(analysisLevel: string, boundary: boolean = true) : string {
    const config = this.getLayerConfigForAnalysisLevel(analysisLevel);
    return boundary
      ? this.isBatchMode ? config.boundaries.simplifiedId || config.boundaries.id : config.boundaries.id
      : (config.centroids || { id: null }).id;
  }
}
