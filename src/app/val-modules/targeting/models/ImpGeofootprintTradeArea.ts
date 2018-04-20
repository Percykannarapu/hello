import { BaseModel } from './../../api/models/BaseModel';
/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintVar } from './ImpGeofootprintVar';

export class ImpGeofootprintTradeArea extends BaseModel
{
   public gtaId:                        number;                        /// Primary key, uniquely identifying a trade areas row
   public taNumber:                     number;                        /// Trade area number
   public taName:                       string;                        /// Trade area name
   public taRadius:                     number;                        /// Trade area radius
   public taMinHhc:                     number;                        /// Trade area minimum hhc
   public taUseMinHhcInd:               number;                        /// Use minimum hhc indicator
   public taType:                       string;                        /// Trade area type (RADIUS, GEO_LIST, ...)
   public taOverrideInd:                number;                        /// Trade area override indicator
   public isActive:                     number;                        /// Is Active

   // IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------------------
   public impGeofootprintLocation:      ImpGeofootprintLocation;       /// Geofootprint Locations table
   public impGeofootprintMaster:        ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public impProject:                   ImpProject;                    /// Captures Project information from the UI

   // IMPOWER.IMP_GEOFOOTPRINT_TRADE_AREAS - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
   // -----------------------------------------------------------------------
   public impGeofootprintGeos:          Array<ImpGeofootprintGeo>;       /// Set of impGeofootprintGeos related to this ImpGeofootprintTradeArea
   public impGeofootprintVars:          Array<ImpGeofootprintVar>;       /// Set of impGeofootprintVars related to this ImpGeofootprintTradeArea

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpGeofootprintTradeArea>) {
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
         ['gtaId',                         'number'],
         ['taNumber',                      'number'],
         ['taName',                        'string'],
         ['taRadius',                      'number'],
         ['taMinHhc',                      'number'],
         ['taUseMinHhcInd',                'number'],
         ['taType',                        'string'],
         ['taOverrideInd',                 'number'],
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