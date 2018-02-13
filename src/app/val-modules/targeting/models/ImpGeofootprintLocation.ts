/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientLocation } from '../../client/models/ImpClientLocation';
import { ImpClientLocationType } from '../../client/models/ImpClientLocationType';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintLocation
{
   public glId:                        number;                        /// Primary key, uniquely identifying a locations row
   public clientIdentifierId:          number;
   public locationIdDisplay:           string;                        /// LOCATION ID displayed on UI
   public locationNumber:              number;
   public locationName:                string;                        /// Name of the location
   public marketName:                  string;
   public groupName:                   string;
   public xcoord:                      number;                        /// X Location coordinate
   public ycoord:                      number;                        /// Y Location coordinate
   public homeGeocode:                 string;                        /// Identifies the location home geography
   public homeGeoName:                 string;                        /// Name of the home geography
   public geoProfileId:                number;                        /// Identifies the geography profile
   public geoProfileTypeAbbr:          string;                        /// Type of geo profile
   public origAddress1:                string;
   public origCity:                    string;
   public origState:                   string;
   public origPostalCode:              string;
   public locFranchisee:               string;                        /// Store franchisee
   public locAddres:                   string;                        /// Store address
   public locCity:                     string;                        /// Store city
   public locState:                    string;                        /// Store state
   public locZip:                      string;                        /// Store zip code
   public locSortOrder:                number;                        /// Locations sort order
   public geocoderMatchCode:           string;
   public geocoderLocationCode:        string;
   public recordStatusCode:            string;

   // IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS - MANY TO ONE RELATIONSHIP MEMBERS
   // ---------------------------------------------------------------------
   public clientIdentifierType:        ClientIdentifierType;          /// Cbx Client Identifier Types
   public impClientLocation:           ImpClientLocation;             /// Client Library Repository of Client Locations
   public impClientLocationType:       ImpClientLocationType;         /// Client Library - Client Location Types (CLIENT, COMPETITOR etc.)
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
         ['clientIdentifierId',           'number'],
         ['locationIdDisplay',            'string'],
         ['locationNumber',               'number'],
         ['locationName',                 'string'],
         ['marketName',                   'string'],
         ['groupName',                    'string'],
         ['xcoord',                       'number'],
         ['ycoord',                       'number'],
         ['homeGeocode',                  'string'],
         ['homeGeoName',                  'string'],
         ['geoProfileId',                 'number'],
         ['geoProfileTypeAbbr',           'string'],
         ['origAddress1',                 'string'],
         ['origCity',                     'string'],
         ['origState',                    'string'],
         ['origPostalCode',               'string'],
         ['locFranchisee',                'string'],
         ['locAddres',                    'string'],
         ['locCity',                      'string'],
         ['locState',                     'string'],
         ['locZip',                       'string'],
         ['locSortOrder',                 'number'],
         ['geocoderMatchCode',            'string'],
         ['geocoderLocationCode',         'string'],
         ['recordStatusCode',             'string']
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
         ['clientIdentifierType',         'ClientIdentifierType'],
         ['impClientLocation',            'ImpClientLocation'],
         ['impClientLocationType',        'ImpClientLocationType'],
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