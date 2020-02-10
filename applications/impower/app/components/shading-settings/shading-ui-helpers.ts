import { ShadingDefinition } from '@val/esri';

export type UIShadingDefinition = ShadingDefinition & { isEditing?: boolean, isNew?: boolean, usableAnalysisLevel?: string, isOpenInUI?: boolean };

