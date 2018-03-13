/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_VARS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintVar
{
   public gvId:                         number;                        /// Primary key, uniquely identifying a geofootprint variable row
   public geocode:                      string;                        /// The geography the variable applies to
   public varPk:                        number;                        /// Variable ID
   public fieldname:                    string;                        /// Descriptive variable name
   public varPosition:                  number;                        /// Order selected
   public isCustom:                     number;                        /// 1 = Is a custom IMPower variable
   public isString:                     number;                        /// 1 = Value is a string
   public isNumber:                     number;                        /// 1 = Value is a number
   public customVarExprDisplay:         string;                        /// Custom variable displayed expression
   public customVarExprQuery:           string;                        /// Custom variable expression
   public valueString:                  string;                        /// Unindexed variable value if is_string = 1
   public valueNumber:                  number;                        /// Unindexed variable value if is_number = 1
   public fieldconte:                   string;                        /// Field contents, notably INDEX indicates an indexed value
   public decimal:                      string;                        /// Decimal precision
   public indexValue:                   number;                        /// Variable indexed value
   public natlAvg:                      string;                        /// National average
   public isActive:                     number;                        /// Is Activee

   // IMPOWER.IMP_GEOFOOTPRINT_VARS - MANY TO ONE RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------
   public impGeofootprintLocation:      ImpGeofootprintLocation;       /// Geofootprint Locations table
   public impGeofootprintMaster:        ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public impGeofootprintTradeArea:     ImpGeofootprintTradeArea;      /// Geofootprint Trade Areas
   public impProject:                   ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintVar | {} = {}) {
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
         ['gvId',                          'number'],
         ['geocode',                       'string'],
         ['varPk',                         'number'],
         ['fieldname',                     'string'],
         ['varPosition',                   'number'],
         ['isCustom',                      'number'],
         ['isString',                      'number'],
         ['isNumber',                      'number'],
         ['customVarExprDisplay',          'string'],
         ['customVarExprQuery',            'string'],
         ['valueString',                   'string'],
         ['valueNumber',                   'number'],
         ['fieldconte',                    'string'],
         ['decimal',                       'string'],
         ['indexValue',                    'number'],
         ['natlAvg',                       'string'],
         ['isActive',                      'number']
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
         ['impProject',                    'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}