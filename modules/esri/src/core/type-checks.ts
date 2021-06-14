import { isNotNil } from '@val/common';

const validGeometryTypes = new Set<string>(['point', 'multipoint', 'polyline', 'polygon', 'extent', 'mesh']);

export function isEsriType<T>(e: T) : e is T & { type: string } {
  return isNotNil(e) && e.hasOwnProperty('type');
}

export function isGroupLayer(l: __esri.Layer) : l is __esri.GroupLayer {
  return isNotNil(l) && l.type === 'group';
}

export function isFeatureLayer(l: __esri.Layer) : l is __esri.FeatureLayer {
  return isNotNil(l) && l.type === 'feature';
}

export function isGraphicsLayer(l: __esri.Layer) : l is __esri.GraphicsLayer {
  return isNotNil(l) && l.type === 'graphics';
}

export function isPortalFeatureLayer(l: __esri.Layer) : l is __esri.FeatureLayer {
  return isFeatureLayer(l) && l.portalItem != null;
}

export function isFeatureLayerView(l: __esri.LayerView) : l is __esri.FeatureLayerView {
  return isFeatureLayer(l.layer);
}

export function isGeometry(a: any) : a is __esri.Geometry {
  return isEsriType(a) && validGeometryTypes.has(a.type);
}

export function isPoint(g: any) : g is __esri.Point;
export function isPoint(g: __esri.Geometry) : g is __esri.Point {
  return isGeometry(g) && g.type === 'point';
}

export function isPolyLine(g: __esri.Geometry) : g is __esri.Polyline {
  return isNotNil(g) && g.type === 'polyline';
}

export function isPolygon(g: __esri.Geometry) : g is __esri.Polygon {
  return isNotNil(g) && g.type === 'polygon';
}

export function isSimpleRenderer(r: __esri.Renderer) : r is __esri.SimpleRenderer {
  return isNotNil(r) && r.type === 'simple';
}

export function isComplexRenderer(r: __esri.Renderer) : r is __esri.UniqueValueRenderer | __esri.ClassBreaksRenderer | __esri.DotDensityRenderer {
  return isUniqueValueRenderer(r) || isClassBreaksRenderer(r) || isDotDensityRenderer(r);
}

export function isUniqueValueRenderer(r: __esri.Renderer) : r is __esri.UniqueValueRenderer {
  return isNotNil(r) && r.type === 'unique-value';
}

export function isClassBreaksRenderer(r: __esri.Renderer) : r is __esri.ClassBreaksRenderer {
  return isNotNil(r) && r.type === 'class-breaks';
}

export function isDotDensityRenderer(r: __esri.Renderer) : r is __esri.DotDensityRenderer {
  return isNotNil(r) && r.type === 'dot-density';
}

export function isSimpleFillSymbol(s: __esri.Symbol) : s is __esri.SimpleFillSymbol {
  return isNotNil(s) && s.type === 'simple-fill';
}

export function isSimpleLineSymbol(s: __esri.Symbol) : s is __esri.SimpleLineSymbol {
  return isNotNil(s) && s.type === 'simple-line';
}

export function isSymbolTableElement(l: __esri.LegendElement) : l is __esri.SymbolTableElement {
  return isNotNil(l) && l.type === 'symbol-table';
}

export function isSymbolTableElementInfo(e: __esri.SymbolTableElementType) : e is __esri.SymbolTableElementInfo {
  return isNotNil(e) && e.hasOwnProperty('symbol') && e['symbol'] != null;
}
