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
  XY = 9
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
  [SelectedButtonTypeCodes.XY] : 'default',
};

export const fillTypeFriendlyNames = {
  ['backward-diagonal'] : 'Backward Diagonal',
  ['cross'] : 'Cross',
  ['diagonal-cross'] : 'Diagonal Cross',
  ['forward-diagonal'] : 'Forward Diagonal',
  ['horizontal'] : 'Horizontal',
  ['solid'] : 'Color Fill',
  ['vertical'] : 'Vertical',
};

export const markerTypeFriendlyNames = {
  ['circle'] : 'Circle',
  ['cross'] : 'Cross',
  ['diamond'] : 'Diamond',
  ['square'] : 'Square',
  ['triangle'] : 'Triangle',
  ['x'] : 'X',
  ['path'] : 'Star'
};

export const shaderConfigTypeFriendlyNames = {
  ['Simple'] : 'Simple',
  ['Unique'] : 'Unique',
  ['ClassBreak'] : 'Class Break',
  ['Ramp'] : 'Ramp',
  ['DotDensity'] : 'Dot Density'
};
