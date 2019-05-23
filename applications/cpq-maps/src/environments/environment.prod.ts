import { EnvironmentData } from './environmentData';

export const environment: EnvironmentData = {
  debugMode: false,
  environmentName: 'PROD',
  fuseBaseUrl: 'https://services.valassis.com/services/',
  production: true,
  esri: {
    portalServer: '',
    username: '',
    password: ''
  },
  layerIds: {
    zip: {
      boundary: 'b1d2b37add4d470ca32bfd9f40d91b9f',
      centroid: 'f0dd4c98bd3843c2b7ed16f04040ff13'
    },
    atz: {
      boundary: 'dac5cea6976a42ceb3f0498d2c901447',
      centroid: '7bde296c08254ed78460accd00c8af49'
    },
    dtz: {
      boundary: '9230ad1f421847f08d6bf0ae2f8ba00f',
      centroid: 'ae57986ce91144e98a65208ef8ae5a1d'
    },
    wrap: {
      boundary: '8dbaa84192c94b5eab3f4e685ba93af7',
      centroid: undefined
    }
  },
  portalUrl: 'https://gis.valassis.com'
};
