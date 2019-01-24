import { FieldContentTypeCodes } from './impower-model.enums';

export class TransientVarDefinition {
  pk: number;
  claritasName: string;
  variableFriendlyName: string;
  variableContent: FieldContentTypeCodes;
  variableType: string;
  variableSource: string;
}
