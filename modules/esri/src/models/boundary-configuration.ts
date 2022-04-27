import { DeepPartial, isNil } from '@val/common';
import { applyFillChanges, applyLabelChanges, duplicateFill, duplicateLabel, FillSymbolDefinition, LabelDefinition } from './common-configuration';

export interface PopupDefinition {
  titleExpression: string;
  useCustomPopup: boolean;
  includeInvestment: boolean;
  popupFields?: string[];
  customPopupPks?: number[];
  customSecondaryPopupPks?: number[];
}

export function duplicatePopupDefinition(def: PopupDefinition) : PopupDefinition {
  if (isNil(def)) return null;
  const result = {
    ...def,
  };
  if (def.popupFields != null) {
    result.popupFields = [ ...def.popupFields ];
  }
  if (def.customPopupPks != null) {
    result.customPopupPks = [ ...def.customPopupPks ];
  }
  if (def.customSecondaryPopupPks != null) {
    result.customSecondaryPopupPks = [ ...def.customSecondaryPopupPks ];
  }
  return result;
}

export function applyPopupChanges(original: PopupDefinition, newValues: DeepPartial<PopupDefinition>) : PopupDefinition {
  if (original == null && newValues == null) return null;
  const usableNewValues = newValues || {};
  const result: PopupDefinition = {
    ...original,
    ...usableNewValues,
  };
  if (original.popupFields != null || usableNewValues.popupFields != null) {
    result.popupFields = Array.from(usableNewValues.popupFields || original.popupFields);
  }
  if (original.customPopupPks != null || usableNewValues.customPopupPks != null) {
    result.customPopupPks = Array.from(usableNewValues.customPopupPks || original.customPopupPks);
  }
  if (original.customSecondaryPopupPks != null || usableNewValues.customSecondaryPopupPks != null) {
    result.customSecondaryPopupPks = Array.from(usableNewValues.customSecondaryPopupPks || original.customSecondaryPopupPks);
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
