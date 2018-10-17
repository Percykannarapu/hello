import { EsriGraphicTypeCodes } from './esri.enums';

export interface CreateCompleteEvent {
  geometry: __esri.Geometry;
  target: any;
  tool: EsriGraphicTypeCodes;
  type: 'create-complete';
}
