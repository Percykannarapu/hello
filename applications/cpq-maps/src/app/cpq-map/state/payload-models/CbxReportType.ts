/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_REPORT_TYPES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';

export interface CbxReportTypePayload extends BaseModelPayload
{
   reportTypeCode:      string;         /// Primary key, uniquely identifies a report
   reportType:          string;         /// Short descriptive text about the report
   description:         string;         /// Full description of the report
   sortOrder:           number;         /// Order in which reports are executed
   isActiveType:        boolean;        /// 1 = Active, 0 = InActive
   isMpReport:          boolean;        /// Is the report post MAA
   isAvailReport:       boolean;        /// Is the report pre MAA
   outputType:          string;         /// Type of report generated
   reportTemplatePath:  string;         /// Location of the BIP template
   hasParam:            number;         /// Does the report have entries in cbx_mp_report_params
   needsMap:            number;         /// Does the report need a map generated
}