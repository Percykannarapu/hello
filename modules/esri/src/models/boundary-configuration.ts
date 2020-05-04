import { FillSymbolDefinition, LabelDefinition } from './common-configuration';

export interface PopupDefinition {
  titleExpression: string;
  useCustomPopup: boolean;
  popupFields: string[];
  secondaryPopupFields?: string[];
}

export interface BoundaryConfiguration {
  id: string;
  dataKey: string;
  sortOrder: number;
  visible: boolean;
  groupName: string;
  portalId: string;
  useSimplifiedInfo: boolean;
  simplifiedPortalId: string;
  centroidPortalId: string;
  layerName: string;
  minScale: number;
  simplifiedMinScale: number;
  opacity: number;
  showLabels: boolean;
  showPOBs: boolean;
  showCentroids: boolean;
  showPopups: boolean;
  hasPOBs: boolean;
  showHouseholdCounts: boolean;
  isPrimarySelectableLayer: boolean;
  labelDefinition: LabelDefinition;
  pobLabelDefinition: LabelDefinition;
  hhcLabelDefinition: LabelDefinition;
  symbolDefinition: FillSymbolDefinition;
  popupDefinition: PopupDefinition;
  destinationBoundaryId?: string;
  destinationCentroidId?: string;
}
