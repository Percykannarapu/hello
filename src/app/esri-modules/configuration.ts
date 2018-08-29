import { ILoadScriptOptions } from 'esri-loader';
import { InjectionToken } from '@angular/core';

export interface EsriConfigOptions extends ILoadScriptOptions, Partial<__esri.config> {
  defaultSpatialRef: number;
  maxPointsPerBufferQuery: number;
  maxPointsPerAttributeQuery: number;
  defaultViewPoint: any;
}

export interface EsriLoaderConfig {
  esriConfig: EsriConfigOptions;
}

export const EsriLoaderToken = new InjectionToken<EsriLoaderConfig>('esri-config-options');
