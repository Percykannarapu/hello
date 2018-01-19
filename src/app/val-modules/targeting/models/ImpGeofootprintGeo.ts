/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_GEOS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintSite } from './ImpGeofootprintSite';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintGeo
{
   public ggId:               number;                        /// Primary key uniquely identifying a geofootprint row
   public geocode:            string;                        /// The geography
   public geoSortOrder:       number;                        /// Geography sort order
   public hhc:                number;                        /// Household count
   public distance:           number;                        /// Geocodes distance to the site

   // IMPOWER.IMP_GEOFOOTPRINT_GEOS - MANY TO ONE RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------
   public cgmId:              ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public gsId:               ImpGeofootprintSite;           /// Geofootprint Sites table
   public gtaId:              ImpGeofootprintTradeArea;      /// Geofootprint Trade Areas
   public projectId:          ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintGeo | {} = {}) {
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
         ['ggId',                'number'],
         ['geocode',             'string'],
         ['geoSortOrder',        'number'],
         ['hhc',                 'number'],
         ['distance',            'number']
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
         ['cgmId',               'ImpGeofootprintMaster'],
         ['gsId',                'ImpGeofootprintSite'],
         ['gtaId',               'ImpGeofootprintTradeArea'],
         ['projectId',           'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}