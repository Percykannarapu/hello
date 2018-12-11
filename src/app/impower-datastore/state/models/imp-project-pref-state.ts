import { ImpProjectPrefPayload } from '../../payload-models/imp-project-pref-payload';
import { BaseModelState, parseStatus } from './base-model-state';

export class ImpProjectPrefState extends BaseModelState {
  public projectPrefId:             number;         /// Primary Key
  public createUser:                number;
  public createDate:                Date;
  public modifyUser:                number;
  public modifyDate:                Date;
  public clientPrefId:              number;
  public projectId:                 number;
  public clientIdentifierTypeCode:  string;
  public clientIdentifierId:        number;
  public attributeCode:             string;
  public attributeType:             string;
  public attributeValue:            string;
  public isActive:                  boolean;

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpProjectPrefPayload>) {
    super();
    const baseStatus = { baseStatus: parseStatus(data.baseStatus) };
    Object.assign(this, data, baseStatus);
  }
}
