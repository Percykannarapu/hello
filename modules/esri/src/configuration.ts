import { InjectionToken } from '@angular/core';
import { LogLevels } from '@val/common';

export interface EsriConfigOptions extends Partial<__esri.config> {
  version: string;
}

export interface EsriAuthenticationParams {
  tokenGenerator: string;
  tokenServer: string;
  userName: string;
  password: string;
}

export interface EsriAppSettings {
  defaultSpatialRef: number;
  maxPointsPerQuery: number;
  maxPointsPerBufferQuery: number;
  maxPointsPerAttributeQuery: number;
  maxPointsPerServiceQuery: number;
  defaultMapParams: __esri.MapProperties;
  defaultViewParams: __esri.MapViewProperties;
  logLevel: LogLevels;
  featureServiceRoot: string;
}

export const esriZoomLocalStorageKey = 'esri-map-use-alternate-zoom';
export const EsriLoaderToken = new InjectionToken<EsriConfigOptions>('esri-config-options');
export const EsriAuthenticationToken = new InjectionToken<EsriAuthenticationParams>('esri-authentication-params');
export const EsriAppSettingsToken = new InjectionToken<EsriAppSettings>('esri-app-settings');
