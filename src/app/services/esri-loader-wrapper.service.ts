import { Injectable } from '@angular/core';
import { EsriLoaderService } from 'angular-esri-loader';

@Injectable()
export class EsriLoaderWrapperService {

  public static esriLoader: EsriLoaderService;
  private static loaded: boolean;

  constructor(public esriLoader: EsriLoaderService) {
    EsriLoaderWrapperService.esriLoader = esriLoader;
  }

  public async loadApi() {

    // enable webGL performance
    // https://developers.arcgis.com/javascript/latest/api-reference/esri-layers-FeatureLayer.html#webgl-rendering
    const dojoConfig = {
      has: {
        'esri-featurelayer-webgl': 1
      }
    };
    if (!EsriLoaderWrapperService.loaded) {
      await EsriLoaderWrapperService.esriLoader.load({
        url: 'https://js.arcgis.com/4.5/init.js'
        //url: './api/init.js'
      });
    }
    EsriLoaderWrapperService.loaded = true;
  }

}
