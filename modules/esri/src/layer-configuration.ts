export interface CustomPopUpDefinition {
  rootFields: string[];
  standardFields: string[];
}

interface LayerBase {
  id: string;
  simplifiedId: string;
  name: string;
  defaultVisibility: boolean;
  sortOrder?: number;
  popupTitle: string;
  minScale: number;
  batchMapMinScale: number;
  labelExpression?: string;
  labelFontSizeOffset?: number;
  labelColorOverride?: { a: number, r: number, g: number, b: number };
}

interface StandardPopUpLayer extends LayerBase {
  useCustomPopUp?: false;
  popUpFields: string[];
}

interface CustomPopUpLayer extends LayerBase {
  useCustomPopUp: true;
  customPopUpDefinition: CustomPopUpDefinition;
}

export type LayerDefinition = StandardPopUpLayer | CustomPopUpLayer;

export interface LayerGroupDefinition {
  group: { name: string, sortOrder: number, analysisLevelName?: string };
  centroids?: LayerDefinition;
  boundaries: LayerDefinition;
  serviceUrl: string;
}

export interface AllLayers {
  [key: string] : LayerGroupDefinition;
}

export interface LayerIdDefinition {
  centroid: string;
  boundary: string;
  simplifiedBoundary: string;
}

export interface BasicLayerSetup extends LayerIdDefinition {
  minScale: number;
  batchMinScale: number;
  defaultFontSize: number;
}

export interface AllLayerIds {
  [key: string] : LayerIdDefinition;
}
