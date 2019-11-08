export enum ConfigurationTypes {
  Simple = 'Simple',
  Unique = 'Unique',
  ClassBreak = 'ClassBreak',
  DotDensity = 'DotDensity'
}

export interface ShadingConfiguration {
  readonly type: ConfigurationTypes;
}

export class SimpleShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.Simple;
  constructor(public layerId: string,
              public layerName: string,
              public minScale: number,
              public opacity: number,
              public defaultLegendName: string,
              public defaultSymbol: __esri.Symbol,
              public expression?: string) {}
}

export class UniqueValueShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.Unique;
  constructor(public layerId: string,
              public layerName: string,
              public minScale: number,
              public opacity: number,
              public arcadeExpression: string,
              public defaultLegendName: string,
              public defaultSymbol: __esri.Symbol,
              public uniqueValues: __esri.UniqueValueInfo[],
              public expression?: string) {}
}

export class ClassBreakShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.ClassBreak;
  constructor(public layerId: string,
              public layerName: string,
              public minScale: number,
              public opacity: number,
              public arcadeExpression: string,
              public defaultLegendName: string,
              public defaultSymbol: __esri.Symbol,
              public classBreaks: __esri.ClassBreaksRendererClassBreakInfos[],
              public classBreakLegendOptions: __esri.ClassBreaksRendererLegendOptions,
              public expression?: string) {}
}

export class DotDensityShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.DotDensity;
  constructor(public layerId: string,
              public layerName: string,
              public minScale: number,
              public opacity: number,
              public legendOptions: __esri.DotDensityRendererLegendOptions,
              public outline: __esri.symbols.SimpleLineSymbol,
              public dotValue: number,
              public referenceScale: number,
              public colorStops: __esri.AttributeColorInfo[],
              public expression?: string) {}
}

export type AllShadingConfigurations =
  SimpleShadingConfiguration |
  UniqueValueShadingConfiguration |
  ClassBreakShadingConfiguration |
  DotDensityShadingConfiguration;
