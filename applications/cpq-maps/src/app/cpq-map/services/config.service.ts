import { Injectable } from '@angular/core';
import { AllLayers } from '@val/esri';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ConfigService {

  public layers: AllLayers = {
    zip: {
      group: {
        name: 'Valassis ZIP',
      },
      centroids: { // ZIP_Centroids
        id: environment.layerIds.zip.centroid,
        name: 'ZIP Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ZIP Top Vars
        id: environment.layerIds.zip.boundary,
        name: 'ZIP Boundaries',
        defaultVisibility: true,
        popupTitle: 'ZIP: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        popUpFields: []
      }
    },
    atz: {
      group: {
        name: 'Valassis ATZ',
      },
      centroids: { // ATZ_Centroids
        id: environment.layerIds.atz.centroid,
        name: 'ATZ Centroids',
        defaultVisibility: false,
        popupTitle: '',
        minScale: 1155600,
        popUpFields: []
      },
      boundaries: { // ATZ_Top_Vars
        id: environment.layerIds.atz.boundary,
        name: 'ATZ Boundaries',
        defaultVisibility: true,
        popupTitle: 'ATZ: {GEOCODE}&nbsp;&nbsp;&nbsp;&nbsp;{CITY_NAME}',
        minScale: 1155600,
        popUpFields: []
      }
    },
    wrap: {
      group: {
        name: 'Valassis WRAP'
      },
      boundaries: { // WRAP_Top_Vars
        id: environment.layerIds.wrap.boundary,
        name: 'Wrap Boundaries',
        defaultVisibility: true,
        popupTitle: 'Wrap: {GEOCODE}<br>{WRAP_NAME}',
        minScale: 577790,
        popUpFields: ['dma_name', 'county_name', 'hhld_s', 'hhld_w', 'num_ip_addrs', 'cov_desc', 'owner_group_primary', 'pricing_name', 'wrap_name', 'cl0c00', 'cl2a00', 'cl2hsz', 'cl2f00', 'cl2m00', 'cl0utw', 'cl2i00']
      }
    }
  };
}
