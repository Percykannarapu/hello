import { FieldContentTypeCodes } from '../../../val-modules/targeting/targeting.enums';

export class TransientVarDefinition {
  pk: number;
  claritasName: string;
  variableFriendlyName: string;
  variableContent: FieldContentTypeCodes;
  variableType: string;
  variableSource: string;
}
