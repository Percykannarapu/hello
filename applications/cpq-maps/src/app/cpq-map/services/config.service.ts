import { Injectable } from '@angular/core';
import { LogLevels } from '@val/common';
import { AllLayers } from '@val/esri';
import { environment } from '../../../environments/environment';
import { LoggingConfiguration } from '../../val-modules/common/services/logging.service';

export interface FieldMetaData {
  fieldType: 'string' | 'numeric' | 'percent';
  fieldLabel: string;
  fieldName: string;
}

@Injectable({
  providedIn: 'root'
})
export class ConfigService implements LoggingConfiguration {

  public defaultShadingTransparency = 0.5; // 50%
  logLevel: LogLevels = environment.logLevel;

  public portalBaseMapNames = [
    { originalName: 'Streets', newName: 'Streets' },
    { originalName: 'Navigation', newName: 'World Navigation Map' },
    { originalName: 'Light Gray Canvas', newName: 'Light Gray Canvas' },
    { originalName: 'Dark Gray Canvas', newName: 'Dark Gray Canvas' },
    { originalName: 'Topographic', newName: 'Topographic' },
    { originalName: 'Imagery Hybrid', newName: 'Satellite' },
    { originalName: 'Oceans', newName: 'Oceans' },
  ];

  public popupFields: FieldMetaData[] = [
    { fieldName: 'zip', fieldLabel: 'Zip', fieldType: 'string', },
    { fieldName: 'pricing_name', fieldLabel: 'Pricing Market', fieldType: 'string', },
    { fieldName: 'sdm_name', fieldLabel: 'Shared Distribution Market', fieldType: 'string', },
    { fieldName: 'wrap_name', fieldLabel: 'Redplum Wrap Zone', fieldType: 'string', },
    { fieldName: 'dma_code', fieldLabel: 'DMA Code', fieldType: 'string', },
    { fieldName: 'county', fieldLabel: 'County FIPS Code', fieldType: 'string', },
    { fieldName: 'cl0c00', fieldLabel: '% CY HHs Familes With Related Children < 18 Yrs', fieldType: 'percent', },
    { fieldName: 'cl2i0r', fieldLabel: '% CY HHs w/HH Inc $50K +', fieldType: 'percent', },
    { fieldName: 'cl2i0p', fieldLabel: '% CY HHs w/HH Inc $75,000 +', fieldType: 'percent', },
    { fieldName: 'cl0utw', fieldLabel: '% CY Owner Occupied Housing Units', fieldType: 'percent', },
    { fieldName: 'cl2prb', fieldLabel: '% Pop Black Alone Non-Hisp', fieldType: 'percent', },
    { fieldName: 'cl2prw', fieldLabel: '% Pop White Alone Non-Hisp', fieldType: 'percent', },
    { fieldName: 'cl2i00', fieldLabel: 'CY Median Household Income', fieldType: 'numeric', },
    { fieldName: 'cl2hwv', fieldLabel: 'CY Median Value, Owner OCC Housing Units', fieldType: 'numeric', },
    { fieldName: 'hhld_w', fieldLabel: 'HouseHolds, Winter', fieldType: 'numeric', },
    { fieldName: 'hhld_s', fieldLabel: 'HouseHolds, Summer', fieldType: 'numeric', },
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
        simplifiedId: null,
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 4622342,
        batchMapMinScale: 4622342,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00'],
        labelExpression: '$feature.wrap_name',
        labelFontSizeOffset: 2
      },
      serviceUrl: environment.layerIds.wrap.serviceUrl
    },
    zip: {
      group: {
        name: 'Valassis ZIP',
        sortOrder: 0,
        analysisLevelName: 'zip'
      },
      centroids: { // ZIP_Centroids
        id: environment.layerIds.zip.centroid,
        simplifiedId: null,
        name: 'ZIP Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 1155600,
        batchMapMinScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ZIP Top Vars
        id: environment.layerIds.zip.boundary,
        simplifiedId: null,
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        batchMapMinScale: 1155600,
        popUpFields: [],
        labelExpression: '$feature.geocode',
        labelFontSizeOffset: 2
      },
      serviceUrl: environment.layerIds.zip.serviceUrl
    },
    atz: {
      group: {
        name: 'Valassis ATZ',
        sortOrder: 1,
        analysisLevelName: 'atz'
      },
      centroids: { // ATZ_Centroids
        id: environment.layerIds.atz.centroid,
        simplifiedId: null,
        name: 'ATZ Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 1155600,
        batchMapMinScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ATZ_Top_Vars
        id: environment.layerIds.atz.boundary,
        simplifiedId: null,
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        batchMapMinScale: 1155600,
        popUpFields: [],
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")'
      },
      serviceUrl: environment.layerIds.atz.serviceUrl

    },
    digital_atz: {
      group: {
        name: 'Valassis Digital ATZ',
        sortOrder: 2,
        analysisLevelName: 'dtz'
      },
      centroids: { // DIG_ATZ_Centroids
        id: environment.layerIds.dtz.centroid,
        simplifiedId: null,
        name: 'Digital ATZ Centroids',
        defaultVisibility: false,
        sortOrder: 1,
        popupTitle: '',
        minScale: 577790,
        batchMapMinScale: 577790,
        popUpFields: []
      },
      boundaries: { // DIG_ATZ_Top_Vars
        id: environment.layerIds.dtz.boundary,
        simplifiedId: null,
        name: 'Digital ATZ Boundaries',
        defaultVisibility: true,
        sortOrder: 0,
        popupTitle: 'Digital ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 577790,
        batchMapMinScale: 577790,
        useCustomPopUp: true,
        customPopUpDefinition: {
          rootFields: ['dma_name', 'county_name', 'Investment'],
          standardFields: ['hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
        },
        labelExpression: 'iif(count($feature.geocode) > 5, right($feature.geocode, count($feature.geocode) - 5), "")'
      },
      serviceUrl: environment.layerIds.dtz.serviceUrl
    }
  };

  public rootDirectory: string = '/gis/arcgis/server/usr/valassis_reports' ;
}
