/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_VARS
 **
 ** Generated from VAL_BASE_GEN - v1.04
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintVar extends BaseModel
{
   public gvId:                  number;         /// Primary key, uniquely identifying a geofootprint variable row
   public cgmId:                 number;         /// Foreign key to imp_geofootprint_master.cgm_id
   public glId:                  number;         /// Foreign key to imp_geofootprint_locations.gl_id
   public gtaId:                 number;         /// Foreign key to imp_geofootprint_trade_areas.gta_id
   public projectId:             number;         /// The IMPower Project ID
   public geocode:               string;         /// The geography the variable applies to
   public varPk:                 number;         /// Variable ID
   public fieldname:             string;         /// Descriptive variable name
   public varPosition:           number;         /// Order selected
   public isCustom:              boolean;        /// 1 = Is a custom IMPower variable
   public isString:              boolean;        /// 1 = Value is a string
   public isNumber:              boolean;        /// 1 = Value is a number
   public customVarExprDisplay:  string;         /// Custom variable displayed expression
   public customVarExprQuery:    string;         /// Custom variable expression
   public valueString:           string;         /// Unindexed variable value if is_string = 1
   public valueNumber:           number;         /// Unindexed variable value if is_number = 1
   public fieldconte:            string;         /// Field contents, notably INDEX indicates an indexed value
   public decimal:               string;         /// Decimal precision
   public indexValue:            number;         /// Variable indexed value
   public natlAvg:               string;         /// National average
   public isActive:              boolean;        /// Is Activee
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintLocation:      ImpGeofootprintLocation;           /// Geofootprint Locations table

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintMaster:        ImpGeofootprintMaster;             /// Geofootprint master table for IMPower.

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impGeofootprintTradeArea:     ImpGeofootprintTradeArea;          /// Geofootprint Trade Areas

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public impProject:                   ImpProject;                        /// Captures Project information from the UI


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpGeofootprintVar>) {
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
         ['gvId',                          'number'],
         ['geocode',                       'string'],
         ['varPk',                         'number'],
         ['fieldname',                     'string'],
         ['varPosition',                   'number'],
         ['isCustom',                      'boolean'],
         ['isString',                      'boolean'],
         ['isNumber',                      'boolean'],
         ['customVarExprDisplay',          'string'],
         ['customVarExprQuery',            'string'],
         ['valueString',                   'string'],
         ['valueNumber',                   'number'],
         ['fieldconte',                    'string'],
         ['decimal',                       'string'],
         ['indexValue',                    'number'],
         ['natlAvg',                       'string'],
         ['isActive',                      'boolean']
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
         ['impGeofootprintLocation',       'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',         'ImpGeofootprintMaster'],
         ['impGeofootprintTradeArea',      'ImpGeofootprintTradeArea'],
         ['impProject',                    'ImpProject'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['impGeofootprintLocation',       'ImpGeofootprintLocation'],
         ['impGeofootprintMaster',         'ImpGeofootprintMaster'],
         ['impGeofootprintTradeArea',      'ImpGeofootprintTradeArea'],
         ['impProject',                    'ImpProject'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}
