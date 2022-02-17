import { isStringArray } from '@val/common';
import { FieldContentTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { ImpProjectVar } from '../../val-modules/targeting/models/ImpProjectVar';
import { AudienceDataDefinition, VarListItem, VarSpecs } from './audience-data.model';

export function createExistingAudienceInstance(projectVar: ImpProjectVar) : AudienceDataDefinition {
  const sourceType = projectVar?.source?.split('_')[0];
  const sourceName = projectVar?.source?.split('_')[1];
  switch (sourceType) {
    case 'Offline':
      return createOfflineAudienceInstance(projectVar.fieldname, `${projectVar.varPk}`, FieldContentTypeCodes.parse(projectVar.fieldconte),
        projectVar.isIncludedInGeofootprint, projectVar.isIncludedInGeoGrid, projectVar.sortOrder);
    case 'Online':
      return createOnlineAudienceInstance(projectVar.fieldname, `${projectVar.varPk}`, FieldContentTypeCodes.parse(projectVar.fieldconte), sourceName,
        projectVar.isIncludedInGeofootprint, projectVar.isIncludedInGeoGrid, projectVar.isNationalExtract, projectVar.indexBase, projectVar.sortOrder);
    case 'Custom':
      return createCustomAudienceInstance(projectVar.fieldname, projectVar.uploadFileName, projectVar.isIncludedInGeofootprint,
        projectVar.isIncludedInGeoGrid, `${projectVar.varPk}`, projectVar.sortOrder, FieldContentTypeCodes.parse(projectVar.fieldconte));
    case 'Converted':
      const conversionSource = JSON.parse(projectVar.customVarExprQuery);
      return createCombinedAudienceInstance(projectVar.fieldname, FieldContentTypeCodes.parse(projectVar.fieldconte), projectVar.indexBase, sourceName,
        sourceType, [], projectVar.customVarExprDisplay, conversionSource, projectVar.isIncludedInGeofootprint,
        projectVar.isIncludedInGeofootprint, `${projectVar.varPk}`, projectVar.sortOrder);
    case 'Combined':
    case 'Combined/Converted':
      const combinedSource = JSON.parse(projectVar.customVarExprQuery);
      return createCombinedAudienceInstance(projectVar.fieldname, FieldContentTypeCodes.parse(projectVar.fieldconte), projectVar.indexBase, sourceName,
        sourceType, combinedSource, projectVar.customVarExprDisplay, [], projectVar.isIncludedInGeofootprint,
        projectVar.isIncludedInGeofootprint, `${projectVar.varPk}`, projectVar.sortOrder);
    case 'Composite':
      const sources = JSON.parse(projectVar.customVarExprQuery);
      return createCompositeAudienceInstance(projectVar.fieldname, projectVar.indexBase, projectVar.customVarExprDisplay, sources,
        projectVar.isIncludedInGeofootprint, projectVar.isIncludedInGeoGrid, `${projectVar.varPk}`, projectVar.sortOrder);
    default:
      return null;
  }
}

export function createOfflineAudienceInstance(name: string, id: string, fieldConte: FieldContentTypeCodes,
                                              isInGfp: boolean = true, isInGrid: boolean = false, sortOrder: number = 0) : AudienceDataDefinition {
  return {
    audienceName: name,
    audienceIdentifier: id,
    audienceSourceType: 'Offline',
    audienceSourceName: 'TDA',
    exportInGeoFootprint: isInGfp,
    showOnGrid: isInGrid,
    exportNationally: false,
    allowNationalExport: false,
    fieldconte: fieldConte,
    requiresGeoPreCaching: true,
    sortOrder
  };
}

export function createOnlineAudienceInstance(categoryName: string, id: string, fieldConte: FieldContentTypeCodes, sourceName: string,
                                             isInGfp: boolean = true, isInGrid: boolean = false, isNationalExtract: boolean = false,
                                             indexBase: string = 'nationalScore', sortOrder?: number) : AudienceDataDefinition {
  return {
    audienceName: categoryName,
    audienceIdentifier: id,
    audienceSourceType: 'Online',
    exportInGeoFootprint: isInGfp,
    showOnGrid: isInGrid,
    fieldconte: fieldConte,
    requiresGeoPreCaching: true,
    sortOrder,
    allowNationalExport: true,
    exportNationally: isNationalExtract,
    audienceSourceName: sourceName,
    dataSetOptions: [{label: 'National', value: 'nationalScore'}, {label: 'DMA', value: 'dmaScore'}],
    selectedDataSet: indexBase,
  };
}

export function createCustomAudienceInstance(name: string, sourceName: string, isInGfp: boolean = true, isInGrid: boolean = false, id?: string,
                                             sortOrder?: number, fieldConte?: FieldContentTypeCodes) : AudienceDataDefinition {
  return {
    audienceIdentifier: id,
    audienceName: name,
    audienceSourceType: 'Custom',
    audienceSourceName: sourceName,
    exportInGeoFootprint: isInGfp,
    showOnGrid: isInGrid,
    exportNationally: false,
    allowNationalExport: false,
    fieldconte: fieldConte,
    requiresGeoPreCaching: false,
    sortOrder
  };
}

export type CombinedSourceType = 'Combined' | 'Converted' | 'Combined/Converted';
export function createCombinedAudienceInstance(name: string, fieldConte: FieldContentTypeCodes, indexBase: string, sourceName: string,
                                               sourceType: CombinedSourceType, audienceSource: string[], variableNames: string, conversionSource: VarSpecs[] | string[],
                                               isInGfp: boolean = true, isInGrid: boolean = false, id?: string, sortOrder?: number) : AudienceDataDefinition {
  return {
    audienceIdentifier: id,
    audienceName: name,
    showOnGrid: isInGrid,
    exportInGeoFootprint: isInGfp,
    exportNationally: false,
    allowNationalExport: false,
    selectedDataSet: indexBase,
    audienceSourceName: sourceName,
    audienceSourceType: sourceType,
    fieldconte: fieldConte,
    requiresGeoPreCaching: true,
    isCombined: sourceType === 'Combined',
    isComposite: false,
    combinedAudiences: audienceSource,
    combinedVariableNames: variableNames,
    compositeSource: conversionSource,
    sortOrder
  };
}

export function createCompositeAudienceInstance(name: string, indexBase: string, variableNames: string, sources: VarSpecs[],
                                                isInGfp: boolean = true, isInGrid: boolean = false, id?: string, sortOrder?: number) : AudienceDataDefinition {
  return {
    audienceIdentifier: id,
    audienceName: name,
    showOnGrid: isInGrid,
    exportInGeoFootprint: isInGfp,
    exportNationally: false,
    allowNationalExport: false,
    selectedDataSet: indexBase,
    audienceSourceName: 'TDA',
    audienceSourceType: 'Composite',
    fieldconte: FieldContentTypeCodes.Index,
    requiresGeoPreCaching: true,
    sortOrder,
    isComposite: true,
    combinedAudiences: [],
    combinedVariableNames: variableNames,
    compositeSource: sources,
  };
}

const baseConverter = {
  nationalScore: 'NAT',
  dmaScore: 'DMA',
  DMA: 'DMA',
  NAT: 'NAT'
};

export function createCombinedVarListItem(audience: AudienceDataDefinition, includeInResponse: boolean) : VarListItem {
  return {
    id: Number(audience.audienceIdentifier),
    desc: audience.audienceName,
    base: includeInResponse ? baseConverter[audience.selectedDataSet] ?? '' : 'SRC',
    source: 'combine',
    combineSource: audience.combinedAudiences.map(c => Number(c))
  };
}

export function createCompositeVarListItem(audience: AudienceDataDefinition, includeInResponse: boolean) : VarListItem {
  const core = {
    id: Number(audience.audienceIdentifier),
    desc: audience.audienceName,
    base: includeInResponse ? baseConverter[audience.selectedDataSet] ?? '' : 'SRC',
    source: 'composite',
  };
  if (isStringArray(audience.compositeSource)) {
    return {
      ...core,
      compositeSource: [{ id: (Number(audience.compositeSource[0])), pct: 100.0, base: audience.selectedDataSet ?? '' }]
    };
  } else {
    return {
      ...core,
      compositeSource: audience.compositeSource
    };
  }
}

export function createAudienceVarListItem(audience: AudienceDataDefinition, includeInResponse: boolean) : VarListItem {
  const base = !includeInResponse
    ? 'SRC'
    : audience.audienceSourceType === 'Online'
      ? baseConverter[audience.selectedDataSet]
      : 'VAL';
  return {
    id: Number(audience.audienceIdentifier),
    desc: audience.audienceName,
    source: audience.audienceSourceType,
    base
  };
}
