import { isNil, isNotNil } from '@val/common';

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
  export function parse(value: string) : AnalysisLevel {
    const result: AnalysisLevel = value?.toLowerCase() === 'digital atz' ? AnalysisLevel.DTZ : AnalysisLevel[value];
    if (isNotNil(value) && isNil(result)) throw new Error(`Unknown Analysis Level: ${value}`);
    return result;
  }
}
