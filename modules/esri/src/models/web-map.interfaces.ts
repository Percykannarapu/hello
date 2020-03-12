import { RgbaTuple } from './esri-types';
import {
  FontDecoration,
  FontStyle,
  FontWeight,
  HorizontalAlignment,
  LabelDuplicateRemoval,
  LabelLinePlacement,
  LabelMultiPartHandling,
  LabelPointPlacement,
  LabelPolygonPlacement,
  MarkerPlacement,
  SimpleFillType,
  SimpleLineType,
  SimpleMarkerType,
  VerticalAlignment
} from './web-map.enums';

export interface Webmap {
  operationalLayers: WebMapLayer[];
}

export type WebMapLayer = ArcGISFeatureLayer;

export interface WebMapLayerBase {
  type: string;
  title: string;
  opacity: number;
}

export interface ArcGISFeatureLayer extends WebMapLayerBase {
  layerType: 'ArcGISFeatureLayer';
  showLabels: boolean;
  showLegend: boolean;
  layerDefinition: {
    definition: string;
    drawingInfo: DrawingInfo;
    maxScale: number;
    minScale: number;
  };
}

export interface DrawingInfo {
  labelingInfo: LabelingInfo[];
  renderer: WebMapRenderer;
}

export type WebMapRenderer = SimpleRenderer | UniqueValueRenderer | ClassBreakRenderer;

interface BaseRenderer {
  visualVariables: WebMapVisualVariable[];
}

export interface ClassBreakRenderer extends BaseRenderer{
  type: 'classBreaks';
  classBreakInfos: {
    classMaxValue: number;
    classMinValue: number;
    description: string;
    label: string;
    symbol: WebMapSymbol;
  }[];
  defaultSymbol: WebMapSymbol;
  defaultLabel: string;
  field: string;
  legendOptions: {
    showLegend: boolean;
    title: string;
  };
  minValue: number;
  valueExpression: string;
  valueExpressionTitle: string;
}

export interface UniqueValueRenderer extends BaseRenderer {
  type: 'uniqueValue';
  defaultSymbol: WebMapSymbol;
  defaultLabel: string;
  field1: string;
  field2: string;
  field3: string;
  fieldDelimiter: string;
  legendOptions: {
    showLegend: boolean;
    title: string;
  };
  uniqueValueInfos: {
    description: string;
    label: string;
    symbol: WebMapSymbol;
    value: string;
  }[];
  valueExpression: string;
  valueExpressionTitle: string;
}

export interface SimpleRenderer extends BaseRenderer {
  type: 'simple';
  description: string;
  label: string;
  symbol: WebMapSymbol;
}

export type WebMapSymbol = EsriSimpleFillSymbol | EsriSimpleLineSymbol | EsriSimpleMarkerSymbol | EsriTextSymbol;

interface BaseSymbol {
  color: RgbaTuple;
}

export interface EsriSimpleFillSymbol extends BaseSymbol {
  type: 'esriSFS';
  outline: EsriSimpleLineSymbol;
  style: SimpleFillType;
}

export interface EsriSimpleLineSymbol extends BaseSymbol {
  type: 'esriSLS';
  style: SimpleLineType;
  marker: {
    placement: MarkerPlacement,
    style: 'arrow'
  };
  width: number;
}

export interface EsriSimpleMarkerSymbol extends BaseSymbol {
  type: 'esriSMS';
  outline: EsriSimpleLineSymbol;
  size: number;
  style: SimpleMarkerType;
}

export interface EsriTextSymbol extends BaseSymbol {
  type: 'esriTS';
  backgroundColor: RgbaTuple;
  borderLineColor: RgbaTuple;
  borderLineSize: number;
  font: Font;
  haloColor: RgbaTuple;
  haloSize: number;
  horizontalAlignment: HorizontalAlignment;
  verticalAlignment: VerticalAlignment;
}

export interface LabelingInfo {
  labelPlacement: LabelLinePlacement | LabelPointPlacement | LabelPolygonPlacement;
  maxScale: number;
  minScale: number;
  multiPart: LabelMultiPartHandling;
  removeDuplicates: LabelDuplicateRemoval;
  removeDuplicateDistance: number;
  name: string;
  priority: number;
  symbol: EsriTextSymbol;
}

export interface Font {
  decoration: FontDecoration;
  family: string;
  size: number;
  style: FontStyle;
  weight: FontWeight;
}

export type WebMapVisualVariable = ColorInfoVisualVariable;

interface BaseVisualVariable {
  field: string;
  legendOptions: {
    order: 'ascendingValues' | 'descendingValues';
    showLegend: boolean;
    title: string;
  };
  valueExpression: string;
  valueExpressionTitle: string;
}

export interface ColorInfoVisualVariable extends BaseVisualVariable {
  type: 'colorInfo';
  stops: {
    color: string | RgbaTuple;
    label: string;
    value: number;
  }[];
}
