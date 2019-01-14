/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_REPORT_PARAMS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface CbxReportParamPayload extends BaseModelPayload
{
   reportParamId:     number;         /// Primary key identifying a particular parameter
   reportRunId:       number;         /// Foreign key to cbx_mp_report_runs.report_run_id
   paramSeq:          number;         /// Order in which parameters are set
   paramName:         string;         /// Name of the parameter
   paramDescription:  string;         /// Description of the parameter
   isNumber:          boolean;        /// 1 = Number, 0 = String
   valueNumber:       number;         /// Value of the parameter if a number
   valueString:       string;         /// Value of the parameter if a string
}