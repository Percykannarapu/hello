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
              public defaultLegendName: string,
              public defaultSymbol: __esri.Symbol) {}
}

export class UniqueValueShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.Unique;
  constructor(public layerId: string,
              public layerName: string,
              public arcadeExpression: string,
              public defaultLegendName: string,
              public defaultSymbol: __esri.Symbol,
              public uniqueValues: __esri.UniqueValueInfo[]) {}
}

export class ClassBreakShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.ClassBreak;
  constructor(public layerId: string,
              public layerName: string,
              public arcadeExpression: string,
              public defaultLegendName: string,
              public defaultSymbol: __esri.Symbol,
              public classBreaks: __esri.ClassBreaksRendererClassBreakInfos[],
              public classBreakLegendOptions: __esri.ClassBreaksRendererLegendOptions) {}
}

export class DotDensityShadingConfiguration implements ShadingConfiguration {
  public readonly type = ConfigurationTypes.DotDensity;
  constructor(public layerId: string,
              public layerName: string,
              public legendOptions: __esri.DotDensityRendererLegendOptions,
              public outline: __esri.symbols.SimpleLineSymbol,
              public dotValue: number,
              public referenceScale: number,
              public colorStops: __esri.AttributeColorInfo[]) {}
}

export type AllShadingConfigurations =
  SimpleShadingConfiguration |
  UniqueValueShadingConfiguration |
  ClassBreakShadingConfiguration |
  DotDensityShadingConfiguration;
