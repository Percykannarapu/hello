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

export enum SelectedButtonTypeCodes {
  ShowPopups = 0,
  SelectSinglePoly = 1,
  MeasureDistance = 2,
  SelectMultiplePolys = 3,
  RemoveGraphics = 4,
  DrawPoint = 5,
  DrawLine = 6,
  Labels = 7,
  UnselectMultiplePolys = 8,
}

export const buttonToCursorMap = {
  [SelectedButtonTypeCodes.SelectSinglePoly] : 'copy',
  [SelectedButtonTypeCodes.DrawPoint] : 'cell',
  [SelectedButtonTypeCodes.DrawLine] : 'crosshair',
  [SelectedButtonTypeCodes.SelectMultiplePolys] : 'crosshair',
  [SelectedButtonTypeCodes.UnselectMultiplePolys] : 'crosshair',
  [SelectedButtonTypeCodes.RemoveGraphics] : 'default',
  [SelectedButtonTypeCodes.ShowPopups] : 'default',
  [SelectedButtonTypeCodes.Labels] : 'default',
  [SelectedButtonTypeCodes.MeasureDistance] : 'crosshair',
};
