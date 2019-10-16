import { EsriAppSettings, EsriAuthenticationParams, EsriConfigOptions } from './src/configuration';

export const SelectedShadingLayerPrefix = 'Selected';

export const defaultEsriUrlFragments = {
  portal: 'arcgis/',
  generator: 'sharing/rest/generateToken',
  tokenServer: 'sharing/rest/portals'
};

export const defaultEsriConfig: EsriConfigOptions = {
  version: '4.11',
  css: true,
  portalUrl:  null,
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
  defaultSpatialRef: 4326,
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
