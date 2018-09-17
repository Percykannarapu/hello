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
  defaultMapParams: __esri.MapProperties;
  defaultViewParams: __esri.MapViewProperties;
}

export interface EsriLoaderConfig {
  esriConfig: EsriConfigOptions;
}

export interface EsriAuthenticationConfig {
  esriAuthParams: EsriAuthenticationParams;
}

export interface EsriAppSettingsConfig {
  esriAppSettings: EsriAppSettings;
}

export const EsriLoaderToken = new InjectionToken<EsriLoaderConfig>('esri-config-options');
export const EsriAuthenticationToken = new InjectionToken<EsriAuthenticationConfig>('esri-authentication-params');
export const EsriAppSettingsToken = new InjectionToken<EsriAppSettingsConfig>('esri-app-settings');

