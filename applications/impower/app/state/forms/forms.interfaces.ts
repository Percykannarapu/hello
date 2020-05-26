import { ColorPalette, ConfigurationTypes, FillSymbolDefinition, RgbaTuple } from '@val/esri';

export interface AddLocationForm {
  number: string;
  name?: string;
  street?: string;
  city?: string;
  state?: string;
  zip?: string;
  Market?: string;
  coord?: string;
}

export interface MarketLocationForm {
  number: string;
  states?: string;
  market: string;
  counts: number;
}

export interface GfpForm {
  layerName: string;
  opacity: number;
}

export interface GfpSelectionForm extends GfpForm {
  defaultSymbolDefinition: FillSymbolDefinition;
}

export interface GfpOwnerForm extends GfpForm {
  secondaryDataKey?: string;
  theme: ColorPalette;
  reverseTheme: boolean;
}

export interface VariableSelectionForm extends GfpForm {
  dataKey: string;
  shadingType: ConfigurationTypes;
  filterByFeaturesOfInterest: boolean;
  dotValue?: number;
  dotColor?: RgbaTuple;
  theme?: ColorPalette;
  reverseTheme?: boolean;
  legendUnits?: string;
  breakDefinitions?: any[];
}

export interface FormsState {
  addLocation: Partial<AddLocationForm>;
  marketLocation: Partial<MarketLocationForm>;
  shadingSettings: {
    [id: string] : Partial<GfpForm>
  };
}
