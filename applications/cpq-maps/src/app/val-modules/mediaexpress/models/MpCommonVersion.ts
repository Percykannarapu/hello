/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_COMMON_VERSIONS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { MediaPlanCommonMbu } from './MediaPlanCommonMbu';

export class MpCommonVersion extends BaseModel
{
   public commonVersionId:      number;
   public createUser:           number;
   public createDate:           Date;
   public modifyUser:           number;
   public modifyDate:           Date;
   public mediaPlanId:          number;
   public advertiserInfoId:     number;
   public versionSequence:      number;
   public uniqueAdVersionCode:  string;
   public clientVersionCode:    string;
   public specialInstruction:   string;
   public sendToAdBuilder:      number;
   public useClientCode:        number;
   public isActive:             boolean;
   public clientOnPiece:        string;         /// Client Name on Piece
   public promotionCode:        string;         /// Client Promotion Name
   public adDate:               Date;
   public draftType:            string;
   public adpickupInHomeDate:   Date;
   public adpickupVersionId:    string;

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public commonMbus:               Array<number> = new Array<number>();
   // ----------------------------------------------------------------------------


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MpCommonVersion>) {
      super();
      Object.assign(this, data);
   }

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['commonVersionId',        'number'],
         ['createUser',             'number'],
         ['createDate',             'Date'],
         ['modifyUser',             'number'],
         ['modifyDate',             'Date'],
         ['mediaPlanId',            'number'],
         ['advertiserInfoId',       'number'],
         ['versionSequence',        'number'],
         ['uniqueAdVersionCode',    'string'],
         ['clientVersionCode',      'string'],
         ['specialInstruction',     'string'],
         ['sendToAdBuilder',        'number'],
         ['useClientCode',          'number'],
         ['isActive',               'boolean'],
         ['clientOnPiece',          'string'],
         ['promotionCode',          'string'],
         ['adDate',                 'Date'],
         ['draftType',              'string'],
         ['adpickupInHomeDate',     'Date'],
         ['adpickupVersionId',      'string']
         ]);
   }

   /**
    * Produces a map of this classes relationships and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getRelationships () : Map<string, string>
   {
      return new Map([
      ]);
   }
}
