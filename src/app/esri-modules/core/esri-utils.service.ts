import { EsriModules } from './esri-modules.service';

export class EsriUtils {

  public static layerIsFeature(l: __esri.Layer) : l is __esri.FeatureLayer {
    return l != null && l.type === 'feature';
  }

  public static geometryIsPoint(g: __esri.Geometry) : g is __esri.Point {
    return g != null && g.type === 'point';
  }
  public static geometryIsPolygon(g: __esri.Geometry) : g is __esri.Polygon {
    return g != null && g.type === 'polygon';
  }

  public static rendererIsSimple(r: __esri.Renderer) : r is __esri.SimpleRenderer {
    return r != null && r.hasOwnProperty('type') && r['type'] === 'simple';
  }

  public static getDistance(a: __esri.Point, b: __esri.Point) : number;
  public static getDistance(a: __esri.Point, x: number, y: number) : number;
  public static getDistance(x1: number, y1: number, x2: number, y2: number) : number;
  public static getDistance(param1: __esri.Point | number, param2: __esri.Point | number, param3?: number, param4?: number) : number {
    let xA: number;
    let yA: number;
    let xB: number;
    let yB: number;
    if (typeof param1 !== 'number') {
      xA = param1.x;
      yA = param1.y;
      if (typeof param2 !== 'number') {
        xB = param2.x;
        yB = param2.y;
      } else {
        xB = param2;
        yB = param3;
      }
    } else {
      xA = param1;
      yA = param2 as number;
      xB = param3;
      yB = param4;
    }
    const line = new EsriModules.PolyLine({ paths: [[[xA, yA], [xB, yB]]] });
    return EsriModules.geometryEngine.geodesicLength(line, 'miles');
  }

  public static clone<T>(original: T) : T {
    return EsriModules.lang.clone(original);
  }
}
