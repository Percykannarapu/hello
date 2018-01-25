/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpClientLocation } from '../../client/models/ImpClientLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintLocation
{
   public glId:                        number;                        /// Primary key, uniquely identifying a locations row
   public locationName:                string;                        /// Name of the location
   public locationIdDisplay:           string;                        /// LOCATION ID displayed on UI
   public xcoord:                      number;                        /// X Location coordinate
   public ycoord:                      number;                        /// Y Location coordinate
   public homeGeocode:                 string;                        /// Identifies the location home geography
   public homeGeoName:                 string;                        /// Name of the home geography
   public geoProfileId:                number;                        /// Identifies the geography profile
   public geoProfileTypeAbbr:          string;                        /// Type of geo profile
   public locFranchisee:               string;                        /// Store franchisee
   public locAddres:                   string;                        /// Store address
   public locCity:                     string;                        /// Store city
   public locState:                    string;                        /// Store state
   public locZip:                      string;                        /// Store zip code
   public locSortOrder:                number;                        /// Locations sort order

   // IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS - MANY TO ONE RELATIONSHIP MEMBERS
   // ---------------------------------------------------------------------
   public impClientLocation:           ImpClientLocation;             /// Client Library Repository of Client Locations
   public impGeofootprintMaster:       ImpGeofootprintMaster;         /// Geofootprint master table for IMPower.
   public impProject:                  ImpProject;                    /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintLocation | {} = {}) {
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
         ['glId',                         'number'],
         ['locationName',                 'string'],
         ['locationIdDisplay',            'string'],
         ['xcoord',                       'number'],
         ['ycoord',                       'number'],
         ['homeGeocode',                  'string'],
         ['homeGeoName',                  'string'],
         ['geoProfileId',                 'number'],
         ['geoProfileTypeAbbr',           'string'],
         ['locFranchisee',                'string'],
         ['locAddres',                    'string'],
         ['locCity',                      'string'],
         ['locState',                     'string'],
         ['locZip',                       'string'],
         ['locSortOrder',                 'number']
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
         ['impClientLocation',            'ImpClientLocation'],
         ['impGeofootprintMaster',        'ImpGeofootprintMaster'],
         ['impProject',                   'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}