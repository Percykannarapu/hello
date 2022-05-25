import { isNil, isNotNil, isString } from '@val/common';

export enum LayerKeys {
  State = 'state',
  DMA = 'DMA',
  Counties = 'IMP_COUNTIES',
  Wrap = 'wrap',
  Zip = 'zip',
  ATZ = 'atz',
  DTZ = 'dtz',
  PCR = 'pcr'
}

export namespace LayerKeys {

  export function parse(value: string) : LayerKeys {
    let result: LayerKeys = value?.toLowerCase() === 'digital atz' ? LayerKeys.DTZ : LayerKeys[value];
    if (isNil(result)) {
      for (const key of Object.keys(LayerKeys)) {
        if (isString(LayerKeys[key]) && value.toUpperCase() === LayerKeys[key].toUpperCase()) result = LayerKeys[key];
      }
    }
    if (isNotNil(value) && isNil(result)) throw new Error(`Unknown LayerKey: ${value}`);
    return result;
  }

  export function friendlyName(key: LayerKeys) : string {
    switch (key) {
      case LayerKeys.State:
        return 'State';
      case LayerKeys.Counties:
        return 'Counties';
      case LayerKeys.Wrap:
        return 'Wrap';
      case LayerKeys.Zip:
        return 'Zip';
      default:
        return key.toUpperCase();
    }
  }
}

export enum LayerTypes {
  Polygon,
  Point
}

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

export const markerStyleDefaultSizes = {
  ['circle'] : 10,
  ['cross'] : 10,
  ['diamond'] : 12,
  ['square'] : 10,
  ['triangle'] : 12,
  ['x'] : 8,
  ['path'] : 10
};
