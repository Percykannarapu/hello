export enum EsriPopupTypeCodes {
  Standard,
  CustomGeography
}

export enum EsriGraphicTypeCodes {
  Point = 'point',
  Multipoint = 'multipoint',
  Polyline = 'polyline',
  Polygon = 'polygon',
  Rectangle = 'rectangle',
  Circle = 'circle'
}

export enum MapStateTypeCodes {
  SelectPoly = 0,
  DrawPoint = 1,
  DrawLine = 2,
  DrawPoly = 3,
  RemoveGraphics = 4,
  Popups = 5,
  Labels = 6,
  MeasureLine = 7
}
