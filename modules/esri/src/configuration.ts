import { InjectionToken } from '@angular/core';
import { LogLevels } from '@val/common';

export interface EsriConfigOptions extends Partial<__esri.config> {
  version: string;
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
  maxPointsPerQuery: number;
  maxPointsPerBufferQuery: number;
  maxPointsPerAttributeQuery: number;
  maxPointsPerServiceQuery: number;
  printServiceUrl: string;
  defaultMapParams: __esri.MapProperties;
  defaultViewParams: __esri.MapViewProperties;
  logLevel: LogLevels;
}

export const EsriLoaderToken = new InjectionToken<EsriConfigOptions>('esri-config-options');
export const EsriAuthenticationToken = new InjectionToken<EsriAuthenticationParams>('esri-authentication-params');
export const EsriAppSettingsToken = new InjectionToken<EsriAppSettings>('esri-app-settings');
