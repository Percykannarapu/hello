import { EsriAppSettings, EsriAuthenticationParams, EsriConfigOptions } from './src/configuration';

export const defaultEsriUrlFragments = {
  portal: 'arcgis/',
  generator: 'sharing/rest/generateToken',
  tokenServer: 'sharing/rest/portals'
};

export const defaultEsriConfig: EsriConfigOptions = {
  url: 'https://js.arcgis.com/4.8/',
  portalUrl:  null,
  request: {
    timeout: 120000
  },
  dojoConfig: {
    has: {
      // 2D WebGL setting - https://blogs.esri.com/esri/arcgis/2017/09/29/featurelayer-taking-advantage-of-webgl-2d/
      'esri-featurelayer-webgl': 1
    }
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
  defaultMapParams: {
    layers: []
  },
  defaultViewParams: {
    center: { longitude: -98.5795, latitude: 39.8282 },
    zoom: 4,
    highlightOptions : {
      color: [0, 255, 0, 0.80],
      fillOpacity: 0,
      haloOpacity: 0.40
    },
    spatialReference: {
      wkid: 102100
    }
  }
};
