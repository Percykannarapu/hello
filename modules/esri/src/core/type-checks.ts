const validGeometryTypes = new Set<string>(['point', 'multipoint', 'polyline', 'polygon', 'extent', 'mesh']);

export function isGroupLayer(l: __esri.Layer) : l is __esri.GroupLayer {
  return l != null && l.type === 'group';
}

export function isFeatureLayer(l: __esri.Layer) : l is __esri.FeatureLayer {
  return l != null && l.type === 'feature';
}

export function isGraphicsLayer(l: __esri.Layer) : l is __esri.GraphicsLayer {
  return l != null && l.type === 'graphics';
}

export function isPortalFeatureLayer(l: __esri.Layer) : l is __esri.FeatureLayer {
  return isFeatureLayer(l) && l.portalItem != null;
}

export function isFeatureLayerView(l: __esri.LayerView) : l is __esri.FeatureLayerView {
  return isFeatureLayer(l.layer);
}

export function isGeometry(a: any) : a is __esri.Geometry {
  return a != null && a.hasOwnProperty('type') && validGeometryTypes.has(a.type);
}

export function isPoint(g: any) : g is __esri.Point;
export function isPoint(g: __esri.Geometry) : g is __esri.Point {
  return isGeometry(g) && g.type === 'point';
}

export function isPolyLine(g: __esri.Geometry) : g is __esri.Polyline {
  return g != null && g.type === 'polyline';
}

export function isPolygon(g: __esri.Geometry) : g is __esri.Polygon {
  return g != null && g.type === 'polygon';
}

export function isSimpleRenderer(r: __esri.Renderer) : r is __esri.SimpleRenderer {
  return r != null && r.type === 'simple';
}

export function isComplexRenderer(r: __esri.Renderer) : r is __esri.UniqueValueRenderer | __esri.ClassBreaksRenderer | __esri.DotDensityRenderer {
  return isUniqueValueRenderer(r) || isClassBreaksRenderer(r) || isDotDensityRenderer(r);
}

export function isUniqueValueRenderer(r: __esri.Renderer) : r is __esri.UniqueValueRenderer {
  return r != null && r.type === 'unique-value';
}

export function isClassBreaksRenderer(r: __esri.Renderer) : r is __esri.ClassBreaksRenderer {
  return r != null && r.type === 'class-breaks';
}

export function isDotDensityRenderer(r: __esri.Renderer) : r is __esri.DotDensityRenderer {
  return r != null && r.type === 'dot-density';
}

export function isSimpleFillSymbol(s: __esri.Symbol) : s is __esri.SimpleFillSymbol {
  return s != null && s.type === 'simple-fill';
}

export function isSimpleLineSymbol(s: __esri.Symbol) : s is __esri.SimpleLineSymbol {
  return s != null && s.type === 'simple-line';
}

export function isSymbolTableElement(l: __esri.LegendElement) : l is __esri.SymbolTableElement {
  return l != null && l.type === 'symbol-table';
}

export function isSymbolTableElementInfo(e: __esri.SymbolTableElementType) : e is __esri.SymbolTableElementInfo {
  return e != null && e.hasOwnProperty('symbol') && e['symbol'] != null;
}
