import { ILoadScriptOptions } from 'esri-loader/src/esri-loader';
import { InjectionToken } from '@angular/core';

export interface EsriConfigOptions extends ILoadScriptOptions, Partial<__esri.config> {
  defaultSpatialRef: number;
  maxPointsPerBufferQuery: number;
  maxPointsPerAttributeQuery: number;
}

export interface EsriLoaderConfig {
  esriConfig: EsriConfigOptions;
}

export const EsriLoaderToken = new InjectionToken<EsriLoaderConfig>('esri-config-options');
