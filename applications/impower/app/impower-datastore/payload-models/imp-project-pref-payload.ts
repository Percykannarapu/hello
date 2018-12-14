import { BaseModelPayload } from './base-model-payload';

export interface ImpProjectPrefPayload extends BaseModelPayload {
   projectPrefId:             number;         /// Primary Key
   createUser:                number;
   createDate:                Date;
   modifyUser:                number;
   modifyDate:                Date;
   clientPrefId:              number;
   projectId:                 number;
   clientIdentifierTypeCode:  string;
   clientIdentifierId:        number;
   attributeCode:             string;
   attributeType:             string;
   attributeValue:            string;
   isActive:                  boolean;
}
