/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_PROJECT_VARS
 **
 ** Generated from VAL_BASE_GEN - v1.04
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ImpProject } from './ImpProject';

export class ImpProjectVar extends BaseModel
{
   public pvId:                      number;         /// Primary key, uniquely identifying a project variable aka audience
   public projectId:                 number;         /// The imPower Project ID
   public varPk:                     number;         /// Variable ID
   public source:                    string;         /// Data Source (ex: TDA, Interest, In-Market, Polk, IMS, IRI Data)
   public indexBase:                 string;         /// National or DMA index scoring base
   public sortOrder:                 number;         /// Order selected
   public fieldname:                 string;         /// Descriptive variable name
   public isShadedOnMap:             boolean;        /// Whether the variable is used to drive map shading
   public isIncludedInGeoGrid:       boolean;        /// Whether the variable is displayed in the application's geography grid
   public isIncludedInGeofootprint:  boolean;        /// Whether the variable is included in the geofootprint - see IMP_GEOFOOTPRINT* tables
   public isNationalExtract:         boolean;        /// Whether the variable is selected for a national export from imPower
   public isCustom:                  boolean;        /// 1 = Is a custom imPower variable
   public isString:                  boolean;        /// 1 = Value is a string
   public isNumber:                  boolean;        /// 1 = Value is a number
   public isUploaded:                boolean;        /// 1 = Is a custom audience uploaded into the imPower application
   public uploadFileName:            string;         /// Source file name if the audience was uploaded
   public customVarExprDisplay:      string;         /// Custom variable displayed expression
   public customVarExprQuery:        string;         /// Custom variable expression
   public fieldconte:                string;         /// Field contents, notably INDEX indicates an indexed value
   public decimal:                   string;         /// Decimal precision
   public isActive:                  boolean;        /// Is Active
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                 ImpProject;          /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpProjectVar>) {
      super();
      Object.assign(this, data);
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
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
         ['pvId',                        'number'],
         ['varPk',                       'number'],
         ['source',                      'string'],
         ['indexBase',                   'string'],
         ['sortOrder',                   'number'],
         ['fieldname',                   'string'],
         ['isShadedOnMap',               'boolean'],
         ['isIncludedInGeoGrid',         'boolean'],
         ['isIncludedInGeofootprint',    'boolean'],
         ['isNationalExtract',           'boolean'],
         ['isCustom',                    'boolean'],
         ['isString',                    'boolean'],
         ['isNumber',                    'boolean'],
         ['isUploaded',                  'boolean'],
         ['uploadFileName',              'string'],
         ['customVarExprDisplay',        'string'],
         ['customVarExprQuery',          'string'],
         ['fieldconte',                  'string'],
         ['decimal',                     'string'],
         ['isActive',                    'boolean']
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
         ['impProject',                  'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['impProject',                  'ImpProject'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}