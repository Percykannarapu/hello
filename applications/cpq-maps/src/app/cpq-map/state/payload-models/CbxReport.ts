/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_REPORT_RUNS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
import { CbxReportTypePayload } from './CbxReportType';
import { CbxReportParamPayload } from './CbxReportParam';

export interface CbxReportPayload extends BaseModelPayload
{
   reportRunId:       number;         /// Primary key identifying a particular report run.
   createUser:        number;         /// User to create the row
   createDate:        Date;           /// Date/Time row was created
   modifyUser:        number;         /// User to modify the row
   modifyDate:        Date;           /// Date/Time row was modified
   advertiserInfoId:  number;         /// Foreign key to cbx_advertiser_info.advertiser_info_id
   cgmId:             number;         /// Foreign key to cbx_geofootprint_master.cgm_id
   profile:           number;         /// Profile ID
   mediaPlanId:       number;         /// Foreign key to cbx_media_plans.media_plan_id
   statusCode:        string;         /// Status of the report
   clientName:        string;         /// UI entered client name to appear on the report
   eventName:         string;         /// UI entered event name to appear on the report
   isSelected:        boolean;        /// Has the report been selected
   isActive:          boolean;        /// Is this report_run_id active
   filepath:          string;         /// Location of the output report

   cbxReportType:     CbxReportTypePayload;  /// Many to one relationship with CbxReportType

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   cbxReportParams:      Array<CbxReportParamPayload>;
   // ----------------------------------------------------------------------------


}