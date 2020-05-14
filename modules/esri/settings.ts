import { LogLevels } from '@val/common';
import { EsriAppSettings, EsriAuthenticationParams, EsriConfigOptions } from './src/configuration';

export const SelectedShadingLayerPrefix = 'Selected';

export const defaultEsriUrlFragments = {
  portal: 'arcgis/',
  generator: 'sharing/rest/generateToken',
  tokenServer: 'sharing/rest/portals'
};

export const defaultEsriConfig: EsriConfigOptions = {
  version: '4.15',
  portalUrl:  null,
  fontsUrl: 'https://static.arcgis.com/fonts',
  request: {
    timeout: 120000
  }
};

export const defaultEsriAuthParams: EsriAuthenticationParams = {
  generatorUrl: null,
  tokenServerUrl: null,
  userName: null,
  password: null,
  referer: null
};

export const defaultEsriAppSettings: EsriAppSettings = {
  logLevel: LogLevels.WARN,
  defaultSpatialRef: 4326,
  maxPointsPerQuery: 3000,
  maxPointsPerBufferQuery: 250,
  maxPointsPerAttributeQuery: 50,
  maxPointsPerServiceQuery: 5000,
  printServiceUrl: null,
  defaultMapParams: {
    layers: []
  },
  defaultViewParams: {
    center: { longitude: -98.5795, latitude: 39.8282 },
    zoom: 4,
    highlightOptions : {
      color: [0, 255, 0, 1],
      fillOpacity: 0.17,
      haloOpacity: 0
    },
    spatialReference: {
      wkid: 102100
    },
    constraints: {
      snapToZoom: false
    }
  }
};
