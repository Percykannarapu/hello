import { InjectionToken } from '@angular/core';
import { defaultEsriAppSettings, defaultEsriAuthParams, defaultEsriConfig, defaultEsriUrlFragments } from './settings';
import { EsriAppSettings, EsriAuthenticationParams, EsriConfigOptions } from './src/configuration';

export interface ForRootOptions {
  portalServerRootUrl: string;
  config?: Partial<EsriConfigOptions>;
  auth?: Partial<EsriAuthenticationParams>;
  app?: Partial<EsriAppSettings>;
}

export const forRootOptionsToken = new InjectionToken<ForRootOptions>('esri Module forRoot() configuration');

export function provideEsriLoaderOptions(options?: ForRootOptions) : EsriConfigOptions {
  let result = defaultEsriConfig;
  if (options != null) {
    result = {
      ...defaultEsriConfig,
      portalUrl: `${options.portalServerRootUrl}${defaultEsriUrlFragments.portal}`,
      ...options.config
    };
  }
  return result;
}

export function provideEsriAuthOptions(options?: ForRootOptions) : EsriAuthenticationParams {
  let result = defaultEsriAuthParams;
  if (options != null) {
    result = {
      ...defaultEsriAuthParams,
      tokenGenerator: `${options.portalServerRootUrl}${defaultEsriUrlFragments.portal}${defaultEsriUrlFragments.tokenGenerator}`,
      tokenServer: `${options.portalServerRootUrl}${defaultEsriUrlFragments.portal}${defaultEsriUrlFragments.tokenServer}`,
      ...options.auth
    };
  }
  return result;
}

export function provideEsriAppOptions(options?: ForRootOptions) : EsriAppSettings {
  let result = defaultEsriAppSettings;
  if (options != null) {
    result = {
      ...defaultEsriAppSettings,
      featureServiceRoot: `${options.portalServerRootUrl}${defaultEsriUrlFragments.portalServer}${defaultEsriUrlFragments.hostedLayer}`,
      ...options.app
    };
  }
  return result;
}
