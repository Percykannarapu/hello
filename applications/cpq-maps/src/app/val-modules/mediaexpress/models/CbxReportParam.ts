/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MP_REPORT_PARAMS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { CbxReport } from './CbxReport';

export class CbxReportParam extends BaseModel
{
   public reportParamId:     number;         /// Primary key identifying a particular parameter
   public reportRunId:       number;         /// Foreign key to cbx_mp_report_runs.report_run_id
   public paramSeq:          number;         /// Order in which parameters are set
   public paramName:         string;         /// Name of the parameter
   public paramDescription:  string;         /// Description of the parameter
   public isNumber:          boolean;        /// 1 = Number, 0 = String
   public valueNumber:       number;         /// Value of the parameter if a number
   public valueString:       string;         /// Value of the parameter if a string
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public cbxReport:      CbxReport;          /// Row is created here everytime a report is run.


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<CbxReportParam>) {
      super();
      Object.assign(this, data);
   }

   // Set tree property and push it down the hierarchy
   public setTreeProperty(propName: string, propValue: any)
   {
      if (!this.hasOwnProperty(propName)) {
         Object.defineProperty(this, propName, {
            enumerable: false,
            configurable: true,
            writable: true
         });
      }
      this[propName] = propValue;
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
   }

   // Convert JSON objects into Models
   public convertToModel()
   {

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
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
         ['reportParamId',     'number'],
         ['paramSeq',          'number'],
         ['paramName',         'string'],
         ['paramDescription',  'string'],
         ['isNumber',          'boolean'],
         ['valueNumber',       'number'],
         ['valueString',       'string']
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
         ['mpReportRun',       'MpReportRun'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['mpReportRun',       'MpReportRun'],
      ]);
   }
}
