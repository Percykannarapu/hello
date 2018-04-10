/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_GEOS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintGeo
{
   public ggId:                         number;                        /// Primary key uniquely identifying a geofootprint row
   public geocode:                      string;                        /// The geography
   public geoSortOrder:                 number;                        /// Geography sort order
   public hhc:                          number;                        /// Household count
   public xCoord:                       number;                        /// x_coord is longitude
   public yCoord:                       number;                        /// y_coord is latitude
   public distance:                     number;                        /// Geocodes distance to the location
   public isActive:                     number;

   // Transient fields
   public rank:                         number;
   public isDeduped:                    number;

   // IMPOWER.IMP_GEOFOOTPRINT_GEOS - MANY TO ONE RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------
   public impGeofootprintLocation:      ImpGeofootprintLocation;       /// Geofootprint Locations table
   public impGeofootprintMaster:        ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public impGeofootprintTradeArea:     ImpGeofootprintTradeArea;      /// Geofootprint Trade Areas
   public impProject:                   ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpGeofootprintGeo>) {
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
         ['ggId',                          'number'],
         ['geocode',                       'string'],
         ['geoSortOrder',                  'number'],
         ['hhc',                           'number'],
         ['xCoord',                        'number'],
         ['yCoord',                        'number'],
         ['distance',                      'number'],
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