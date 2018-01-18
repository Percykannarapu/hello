/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintSite } from './ImpGeofootprintSite';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintTradeArea
{
   public gtaId:                    number;                        /// Primary key, uniquely identifying a trade areas row
   public taNumber:                 number;                        /// Trade area number
   public taName:                   string;                        /// Trade area name
   public taRadiu:                  number;                        /// Trade area radius
   public taMinHhc:                 number;                        /// Trade area minimum hhc
   public taUseMinHhcInd:           number;                        /// Use minimum hhc indicator
   public taType:                   string;                        /// Trade area type (RADIUS, GEO_LIST, ...)
   public taOverrideInd:            number;                        /// Trade area override indicator
   public taNameWebDisplay:         string;

   // IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------------------
   public cgmId:                    ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public gsId:                     ImpGeofootprintSite;           /// Geofootprint Sites table
   public projectId:                ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintTradeArea | {} = {}) {
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
         ['gtaId',                     'number'],
         ['taNumber',                  'number'],
         ['taName',                    'string'],
         ['taRadiu',                   'number'],
         ['taMinHhc',                  'number'],
         ['taUseMinHhcInd',            'number'],
         ['taType',                    'string'],
         ['taOverrideInd',             'number'],
         ['taNameWebDisplay',          'string']
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
         ['cgmId',                     'ImpGeofootprintMaster'],
         ['gsId',                      'ImpGeofootprintSite'],
         ['projectId',                 'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}