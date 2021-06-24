/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_REPORT_RUNS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlan } from './MediaPlan';
import { CbxReportType } from './CbxReportType';
import { CbxReportParam } from './CbxReportParam';

export class CbxReport extends BaseModel
{
   public reportRunId:       number;         /// Primary key identifying a particular report run.
   public createUser:        number;         /// User to create the row
   public createDate:        Date;           /// Date/Time row was created
   public modifyUser:        number;         /// User to modify the row
   public modifyDate:        Date;           /// Date/Time row was modified
   public advertiserInfoId:  number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   public cgmId:             number;         /// Foreign key to cbx_geofootprint_master.cgm_id
   public profile:           number;         /// Profile ID
   public mediaPlanId:       number;         /// Foreign key to cbx_media_plans.media_plan_id
   public statusCode:        string;         /// Status of the report
   public clientName:        string;         /// UI entered client name to appear on the report
   public eventName:         string;         /// UI entered event name to appear on the report
   public isSelected:        boolean;        /// Has the report been selected
   public isActive:          boolean;        /// Is this report_run_id active
   public filepath:          string;         /// Location of the output report

   public cbxReportType:     CbxReportType;  /// Many to one relationship with CbxReportType

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public cbxReportParams:      Array<number> = new Array<number>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public advertiserInfo:         AdvertiserInfo;              /// Captures advertiser information from the UI

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlan:              MediaPlan;                   /// Media plans for an advertiser info id / profile


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<CbxReport>) {
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
         ['reportRunId',             'number'],
         ['createUser',              'number'],
         ['createDate',              'Date'],
         ['modifyUser',              'number'],
         ['modifyDate',              'Date'],
         ['profile',                 'number'],
         ['clientName',              'string'],
         ['eventName',               'string'],
         ['isSelected',              'boolean'],
         ['isActive',                'boolean'],
         ['filepath',                'string'],
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
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['advertiserInfo',          'AdvertiserInfo'],
         ['mediaPlan',               'MediaPlan'],
         ['cbxReportType',           'CbxReportType'],
      ]);
   }
}
