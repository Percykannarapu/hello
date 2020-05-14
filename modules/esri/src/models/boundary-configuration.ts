import { duplicateFill, duplicateLabel, FillSymbolDefinition, LabelDefinition } from './common-configuration';

export interface PopupDefinition {
  titleExpression: string;
  useCustomPopup: boolean;
  popupFields: string[];
  secondaryPopupFields?: string[];
  hiddenPopupFields?: string[];
}

export function duplicatePopupDefinition(def: PopupDefinition) : PopupDefinition {
  const result = {
    ...def,
    popupFields: [ ...def.popupFields ],
  };
  if (def.secondaryPopupFields == null) {
    result.secondaryPopupFields = [ ...def.secondaryPopupFields ];
  }
  return result;
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

export function duplicateBoundaryConfig(config: BoundaryConfiguration) : BoundaryConfiguration {
  return {
    ...config,
    labelDefinition: duplicateLabel(config.labelDefinition),
    pobLabelDefinition: duplicateLabel(config.pobLabelDefinition),
    hhcLabelDefinition: duplicateLabel(config.hhcLabelDefinition),
    symbolDefinition: duplicateFill(config.symbolDefinition),
    popupDefinition: duplicatePopupDefinition(config.popupDefinition)
  };
}
