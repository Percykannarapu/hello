import { DeepPartial } from '@val/common';
import { applyFillChanges, applyLabelChanges, duplicateFill, duplicateLabel, FillSymbolDefinition, LabelDefinition } from './common-configuration';

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
  if (def.secondaryPopupFields != null) {
    result.secondaryPopupFields = [ ...def.secondaryPopupFields ];
  }
  if (def.hiddenPopupFields != null) {
    result.hiddenPopupFields = [ ...def.hiddenPopupFields ];
  }
  return result;
}

export function applyPopupChanges(original: PopupDefinition, newValues: DeepPartial<PopupDefinition>) : PopupDefinition {
  if (original == null && newValues == null) return null;
  const usableNewValues = newValues || {};
  const result = {
    ...original,
    ...usableNewValues,
    popupFields: Array.from(usableNewValues.popupFields || original.popupFields),
  };
  if (original.secondaryPopupFields != null || usableNewValues.secondaryPopupFields != null) {
    result.secondaryPopupFields = Array.from(usableNewValues.secondaryPopupFields || original.secondaryPopupFields);
  }
  if (original.hiddenPopupFields != null || usableNewValues.hiddenPopupFields != null) {
    result.hiddenPopupFields = Array.from(usableNewValues.hiddenPopupFields || original.hiddenPopupFields);
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

export function applyBoundaryChanges(original: BoundaryConfiguration, newValues: DeepPartial<BoundaryConfiguration>) : BoundaryConfiguration {
  if (original == null && newValues == null) return null;
  const usableNewValues = newValues || {};
  return {
    ...original,
    ...usableNewValues,
    labelDefinition: applyLabelChanges(original.labelDefinition, usableNewValues.labelDefinition),
    pobLabelDefinition: applyLabelChanges(original.pobLabelDefinition, usableNewValues.pobLabelDefinition),
    hhcLabelDefinition: applyLabelChanges(original.hhcLabelDefinition, usableNewValues.hhcLabelDefinition),
    symbolDefinition: applyFillChanges(original.symbolDefinition, usableNewValues.symbolDefinition),
    popupDefinition: applyPopupChanges(original.popupDefinition, usableNewValues.popupDefinition)
  };
}
