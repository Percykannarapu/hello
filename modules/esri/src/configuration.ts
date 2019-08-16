import { ILoadScriptOptions } from 'esri-loader';
import { InjectionToken } from '@angular/core';

export interface EsriConfigOptions extends ILoadScriptOptions, Partial<__esri.config> {
}

export interface EsriAuthenticationParams {
  generatorUrl: string;
  tokenServerUrl: string;
  userName: string;
  password: string;
  referer: string;
}

export interface EsriAppSettings {
  defaultSpatialRef: number;
  maxPointsPerBufferQuery: number;
  maxPointsPerAttributeQuery: number;
  maxPointsPerServiceQuery: number;
  printServiceUrl: string;
  defaultMapParams: __esri.MapProperties;
  defaultViewParams: __esri.MapViewProperties;
}

export const EsriLoaderToken = new InjectionToken<EsriConfigOptions>('esri-config-options');
export const EsriAuthenticationToken = new InjectionToken<EsriAuthenticationParams>('esri-authentication-params');
export const EsriAppSettingsToken = new InjectionToken<EsriAppSettings>('esri-app-settings');
