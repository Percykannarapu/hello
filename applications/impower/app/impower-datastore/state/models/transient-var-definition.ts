import { FieldContentTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';

export class TransientVarDefinition {
  pk: number;
  claritasName: string;
  variableFriendlyName: string;
  variableContent: FieldContentTypeCodes;
  variableType: string;
  variableSource: string;
}
