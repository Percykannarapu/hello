import { ColorPalette, ConfigurationTypes, RgbaTuple, SymbolDefinition } from '@val/esri';

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

export interface GfpForm {
  layerName: string;
  opacity: number;
}

export interface GfpSelectionForm extends GfpForm {
  defaultSymbolDefinition: SymbolDefinition;
}

export interface GfpSiteOwnerForm extends GfpForm {
  secondaryDataKey: string;
}

export interface VariableSelectionForm extends GfpForm {
  dataKey: string;
  shadingType: ConfigurationTypes;
  filterByFeaturesOfInterest: boolean;
  theme?: ColorPalette;
  reverseTheme?: boolean;
  dotValue?: number;
  dotColor?: RgbaTuple;
  legendUnits?: string;
}

export interface FormsState {
  addLocation: Partial<AddLocationForm>;
  shadingSettings: {
    [id: string] : Partial<GfpForm>
  };
}
