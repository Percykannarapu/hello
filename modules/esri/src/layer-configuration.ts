export interface CustomPopUpDefinition {
  rootFields: string[];
  standardFields: string[];
}

interface LayerBase {
  id: string;
  name: string;
  defaultVisibility: boolean;
  popupTitle: string;
  minScale: number;
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
  group: { name: string };
  centroids?: LayerDefinition;
  boundaries: LayerDefinition;
}

export interface AllLayers {
  [key: string] : LayerGroupDefinition;
}

export interface AllLayerIds {
  [key: string] : { centroid: string, boundary: string };
}
