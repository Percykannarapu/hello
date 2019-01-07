/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_REPORT_TYPES
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { CbxReport } from './CbxReport';

export class CbxReportType extends BaseModel
{
   public reportTypeCode:      string;         /// Primary key, uniquely identifies a report
   public reportType:          string;         /// Short descriptive text about the report
   public description:         string;         /// Full description of the report
   public sortOrder:           number;         /// Order in which reports are executed
   public isActiveType:        boolean;        /// 1 = Active, 0 = InActive
   public isMpReport:          boolean;        /// Is the report post MAA
   public isAvailReport:       boolean;        /// Is the report pre MAA
   public outputType:          string;         /// Type of report generated
   public reportTemplatePath:  string;         /// Location of the BIP template
   public hasParam:            number;         /// Does the report have entries in cbx_mp_report_params
   public needsMap:            number;         /// Does the report need a map generated

   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getMpReportRuns(): ReadonlyArray<CbxReport> {
      let _result: Array<CbxReport> = new Array<CbxReport>();
      return _result;
   }


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<CbxReportType>) {
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
         ['reportTypeCode',       'string'],
         ['createUser',           'number'],
         ['createDate',           'Date'],
         ['modifyUser',           'number'],
         ['modifyDate',           'Date'],
         ['reportType',           'string'],
         ['description',          'string'],
         ['sortOrder',            'number'],
         ['isActive',             'boolean'],
         ['isMpReport',           'boolean'],
         ['isAvailReport',        'boolean'],
         ['outputType',           'string'],
         ['reportTemplatePath',   'string'],
         ['hasParam',             'number'],
         ['isSelected',           'boolean'],
         ['needsMap',             'number']
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

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['mpReportRun',          'Array<MpReportRun>'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}