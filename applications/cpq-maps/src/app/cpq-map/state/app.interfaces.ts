export type GridSize = 'small' | 'large' | 'none';

export interface PrintModel {
  clientName: string;
  layerSource: string;
  siteFeatures: Array<__esri.Graphic>;
  shadingFeatures: Array<__esri.Graphic>;
  boundaryDefinitionExpression: string;
  secondaryLayerSourceLabelingExpression: string;
  layerSourceLabelingExpression: string;
  secondaryLayerSource: string;
}

export interface PrintPayload {
  sites: string;
  radius: number;
  inHomeDate: string;
  reportName: string;
  rfpNumber: string;
  mediaPlanId: number;
  tradeArea: string;
}

export interface FullPayload {
  clientName: string;
  layerSource: string;
  secondaryLayerSourceLabelingExpression: string;
  layerSourceLabelingExpression: string;
  secondaryLayerSource: string;
  radius: number;
  inHomeDate: string;
  reportName: string;
  rfpNumber: string;
  mediaPlanId: number;
  tradeArea: string;
}

export interface ResultType {
  paramName?: string;
  dataType?: string;
  value: string;
}

export interface LegendData {
  groupName: string;
  hhc: number;
  color?: number[];
  sortOrder?: number;
  image?: string;
}
