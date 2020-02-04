import { ColorPalette, SymbolDefinition } from '@val/esri';

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

export interface VariableSelectionForm extends GfpForm {
  audienceId: string;
  extent: string;
  theme: ColorPalette;
}

export interface FormsState {
  addLocation: Partial<AddLocationForm>;
  shadingSettings: Partial<GfpForm>;
}
