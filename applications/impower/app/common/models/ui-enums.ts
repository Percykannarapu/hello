import { isNil, isNotNil, isString } from '@val/common';

export enum ProjectFilterChanged {
  Valassis,
  Anne,
  Solo,
  Pob
}

export enum GfpShaderKeys {
  Selection = 'selection-shading',
  OwnerSite = 'owner-site-shading',
  OwnerTA = 'owner-ta-shading',
  PcrIndicator = 'pcr-indicator'
}

export enum AnalysisLevel {
  Zip = 'zip',
  ATZ = 'atz',
  DTZ = 'dtz',
  PCR = 'pcr'
}

export namespace AnalysisLevel {

  export function parse(value: string, throwIfNotParsable: boolean = true) : AnalysisLevel {
    if (isNil(value)) return null;
    let result: AnalysisLevel = value?.toLowerCase() === 'digital atz' ? AnalysisLevel.DTZ : AnalysisLevel[value];
    if (isNil(result)) {
      for (const key of Object.keys(AnalysisLevel)) {
        if (isString(AnalysisLevel[key]) && value.toUpperCase() === AnalysisLevel[key].toUpperCase()) result = AnalysisLevel[key];
      }
    }
    if (isNotNil(value) && isNil(result) && throwIfNotParsable) throw new Error(`Unknown Analysis Level: ${value}`);
    return result;
  }

  export function friendlyName(value: AnalysisLevel) : string {
    switch (value) {
      case AnalysisLevel.Zip:
        return 'Zip';
      case AnalysisLevel.DTZ:
        return 'Digital ATZ';
      default:
        return value.toUpperCase();
    }
  }
}
