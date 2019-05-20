import { Injectable } from '@angular/core';
import { AllLayers } from '@val/esri';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

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
    wrap: {
      group: {
        name: 'Valassis WRAP',
        sortOrder: 3,
        analysisLevelName: 'wrap'
      },
      boundaries: { // WRAP_Top_Vars
        id: environment.layerIds.wrap.boundary,
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 4622342,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00'],
        labelExpression: '$feature.wrap_name',
        labelFontSizeOffset: 2
      },
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/WRAP_Top_Vars_Portal_Copy_All_Data/FeatureServer/0'
    },
    zip: {
      group: {
        name: 'Valassis ZIP',
        sortOrder: 0,
        analysisLevelName: 'zip'
      },
      centroids: { // ZIP_Centroids
        id: environment.layerIds.zip.centroid,
        name: 'ZIP Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ZIP Top Vars
        id: environment.layerIds.zip.boundary,
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        popUpFields: [],
        labelExpression: '$feature.geocode',
        labelFontSizeOffset: 2
      },
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/ZIP_Top_Vars_CopyAllData/FeatureServer/0'
    },
    atz: {
      group: {
        name: 'Valassis ATZ',
        sortOrder: 1,
        analysisLevelName: 'atz'
      },
      centroids: { // ATZ_Centroids
        id: environment.layerIds.atz.centroid,
        name: 'ATZ Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ATZ_Top_Vars
        id: environment.layerIds.atz.boundary,
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        popUpFields: [],
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")'
      },
      serviceUrl: 'https://gis.valassislab.com/arcgis-server/rest/services/Hosted/ATZ_Top_Vars_CopyAllData/FeatureServer/0'

    },
    digital_atz: {
      group: {
        name: 'Valassis Digital ATZ',
        sortOrder: 2,
        analysisLevelName: 'dtz'
      },
      centroids: { // DIG_ATZ_Centroids
        id: environment.layerIds.dtz.centroid,
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 577790,
        popUpFields: []
      },
      boundaries: { // DIG_ATZ_Top_Vars
        id: environment.layerIds.dtz.boundary,
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
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")'
      },
      serviceUrl: ''
    }
  };

  public rootDirectory: string = '/gis/arcgis/server/usr/valassis_reports' ;
}
