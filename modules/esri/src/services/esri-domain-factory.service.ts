import { Inject, Injectable } from '@angular/core';
import Color from 'esri/Color';
import { Extent } from 'esri/geometry';
import GraphicsLayer from 'esri/layers/GraphicsLayer';
import LabelClass from 'esri/layers/support/LabelClass';
import { ClassBreaksRenderer, DotDensityRenderer, SimpleRenderer, UniqueValueRenderer } from 'esri/renderers';
import { Font, SimpleFillSymbol, SimpleLineSymbol, TextSymbol } from 'esri/symbols';
import SketchViewModel from 'esri/widgets/Sketch/SketchViewModel';
import { EsriAppSettings, EsriAppSettingsToken } from '../configuration';
import { AutoCastColor, FillPattern, LineStyle } from '../models/esri-types';

@Injectable()
export class EsriDomainFactoryService {

  constructor(@Inject(EsriAppSettingsToken) private config: EsriAppSettings) { }

  createExtent(xStats: { min: number, max: number }, yStats: { min: number, max: number }, minPadding?: number) : __esri.Extent {
    const result = new Extent({
      xmin: xStats.min,
      ymin: yStats.min,
      xmax: xStats.max,
      ymax: yStats.max,
      spatialReference: {
        wkid: this.config.defaultSpatialRef
      }
    });

    if (minPadding && result.width === 0) {
      result.xmin = result.xmin - minPadding;
      result.xmax = result.xmax + minPadding;
    }
    if (minPadding && result.height === 0) {
      result.ymin = result.ymin - minPadding;
      result.ymax = result.ymax + minPadding;
    }
    return result;
  }

  createSketchViewModel(currentMapView: __esri.MapView) : __esri.SketchViewModel {
    if (currentMapView == null) throw new Error('The SketchViewModel factory requires a valid MapView instance.');
    const result = new SketchViewModel({
      view: currentMapView,
      layer: new GraphicsLayer({}),
      pointSymbol: {
        type: 'simple-marker',
        style: 'square',
        color: '#8A2BE2',
        size: '16px',
        outline: {
          color: [255, 255, 255],
          width: 3 // points
        }
      },
      polylineSymbol: {
        type: 'simple-line',
        style: 'short-dash',
        width: 1.25,
        color: [230, 0, 0, 1]
      },
      polygonSymbol: {
        type: 'simple-fill',
        color: 'rgba(0,0,0,0)',
        style: 'solid',
        outline: {
          color: 'red',
          width: 1
        }
      }
    } as any);

    // the sketchViewModel introduces an empty GraphicsLayer to the map,
    // even if you specify a local temp layer. This code is to suppress
    // this layer so it doesn't show in the layer list
    currentMapView.map.allLayers.forEach(l => {
      if (l.title == null) l.listMode = 'hide';
    });
    return result;
  }

  createLabelClass(color: __esri.Color, expression: string) : __esri.LabelClass {
    const textSymbol: __esri.TextSymbol = new TextSymbol({
      backgroundColor: new Color({a: 1, r: 255, g: 255, b: 255}),
      haloColor: new Color({a: 1, r: 255, g: 255, b: 255}),
      color,
      haloSize: 1,
      font: new Font({ family: 'sans-serif', size: 12, weight: 'bold' })
    });
    return new LabelClass({
      symbol: textSymbol,
      labelPlacement: 'below-center',
      labelExpressionInfo: {
        expression: expression
      }
    });
  }

  createSimpleRenderer(symbol: __esri.Symbol, visualVariable?: __esri.ColorVariableProperties) : __esri.SimpleRenderer {
    return new SimpleRenderer({
      symbol,
      visualVariables: [ visualVariable ]
    });
  }

  createUniqueValueRenderer(defaultSymbol: __esri.Symbol, infos: __esri.UniqueValueRendererUniqueValueInfos[], visualVariable?: __esri.ColorVariableProperties) : __esri.UniqueValueRenderer {
    return new UniqueValueRenderer({
      defaultSymbol,
      uniqueValueInfos: [...infos],
      visualVariables: [ visualVariable ]
    });
  }

  createClassBreakRenderer(defaultSymbol: __esri.Symbol, classBreaks: __esri.ClassBreaksRendererClassBreakInfos[], visualVariable?: __esri.ColorVariableProperties) : __esri.ClassBreaksRenderer {
    return new ClassBreaksRenderer({
      defaultSymbol,
      classBreakInfos: [...classBreaks],
      visualVariables: [ visualVariable ]
    });
  }

  createDotDensityRenderer(outline: __esri.symbols.SimpleLineSymbol, referenceDotValue: number, attributes: __esri.AttributeColorInfoProperties[]) : __esri.DotDensityRenderer {
    return new DotDensityRenderer({
      outline,
      referenceDotValue,
      attributes
    });
  }

  createSimpleLineSymbol(color: AutoCastColor, width: number | string = 1, style: LineStyle = 'solid') : __esri.symbols.SimpleLineSymbol {
    return new SimpleLineSymbol({
      color,
      width,
      style
    });
  }

  createSimpleFillSymbol(color: AutoCastColor, outline: __esri.symbols.SimpleLineSymbol, style: FillPattern = 'solid') : __esri.symbols.SimpleFillSymbol {
    return new SimpleFillSymbol({
      color,
      outline,
      style
    });
  }
}
