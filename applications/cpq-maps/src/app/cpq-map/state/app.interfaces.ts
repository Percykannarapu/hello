export interface PrintModel {
  clientName: string;
  layerSource: string;
  siteFeatures: Array<__esri.Graphic>;
  shadingFeatures: Array<__esri.Graphic>;
  boundaryDefinitionExpression: string;
  zipsLabelingExpression: string;
  layerSourceLabelingExpression: string;
}

export interface PrintPayload {
  sites: PrintModel;
  radius: number;
  inHomeDate: string;
  reportName: string;
  rfpNumber: string;
  mediaPlanId: number;
  tradeArea: string;
  userEmail: string;
  rootDirectory: string;
}


export interface FullPayload {
  clientName: string;
  layerSource: string;
  zipsLabelingExpression: string;
  layerSourceLabelingExpression: string;
  radius: number;
  inHomeDate: string;
  reportName: string;
  rfpNumber: string;
  mediaPlanId: number;
  tradeArea: string;
  userEmail: string;
}




