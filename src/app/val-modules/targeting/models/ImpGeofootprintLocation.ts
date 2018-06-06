/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/
import { BaseModel, DAOBaseStatus } from './../../api/models/BaseModel';
import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ImpClientLocation } from '../../client/models/ImpClientLocation';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintVar } from './ImpGeofootprintVar';
import { ImpGeofootprintLocAttrib } from './ImpGeofootprintLocAttrib';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';

export class ImpGeofootprintLocation extends BaseModel
{
   public glId:                        number;                        /// Primary key, uniquely identifying a locations row
   public cgmId:                       number;
   public projectId:                   number;
   public clientLocationId:            number;
   public clientLocationTypeCode:      string;
   public clientIdentifierTypeCode:    string;
   public clientIdentifierId:          number;
   public locationIdDisplay:           string;                        /// LOCATION ID displayed on UI
   public locationNumber:              string;
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
   public locAddress:                  string;                        /// Store address
   public locCity:                     string;                        /// Store city
   public locState:                    string;                        /// Store state
   public locZip:                      string;                        /// Store zip code
   public locSortOrder:                number;                        /// Locations sort order
   public geocoderMatchCode:           string;
   public geocoderLocationCode:        string;
   public recordStatusCode:            string;
   public isActive:                    boolean;                        /// Is Active
   
   // IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
   // ---------------------------------------------------------------------
   public impGeofootprintLocAttribs:   Array<ImpGeofootprintLocAttrib>; /// Set of impGeofootprintLocAttribs related to this ImpGeofootprintLocation
   public impGeofootprintTradeAreas:   Array<ImpGeofootprintTradeArea>; /// Set of impGeofootprintTradeAreas related to this ImpGeofootprintLocation
   
   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpGeofootprintLocation>) {
      super();
//      this.clear();
      Object.assign(this, data);
   }

   public clear() 
   {
      this.dirty                    = true;
      this.baseStatus               = null; // DAOBaseStatus.INSERT;
      this.glId                     = null;
      this.cgmId                    = null;
      this.projectId                = null;
      this.clientLocationId         = null;
      this.clientLocationTypeCode   = null;
      this.clientIdentifierTypeCode = null;
      this.clientIdentifierId       = null;
      this.locationIdDisplay        = null;
      this.locationNumber           = null;
      this.locationName             = null;
      this.marketName               = null;
      this.groupName                = null;
      this.xcoord                   = null;
      this.ycoord                   = null;
      this.homeGeocode              = null;
      this.homeGeoName              = null;
      this.geoProfileId             = null;
      this.geoProfileTypeAbbr       = null;
      this.origAddress1             = null;
      this.origCity                 = null;
      this.origState                = null;
      this.origPostalCode           = null;
      this.locFranchisee            = null;
      this.locAddress               = null;
      this.locCity                  = null;
      this.locState                 = null;
      this.locZip                   = null;
      this.locSortOrder             = null;
      this.geocoderMatchCode        = null;
      this.geocoderLocationCode     = null;
      this.recordStatusCode         = null;
      this.isActive                 = true;
      
      // IMPOWER.IMP_GEOFOOTPRINT_LOCATIONS - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
      // ---------------------------------------------------------------------
      this.impGeofootprintLocAttribs = null;
      this.impGeofootprintTradeAreas = null;
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
         ['locAddress',                   'string'],
         ['locCity',                      'string'],
         ['locState',                     'string'],
         ['locZip',                       'string'],
         ['locSortOrder',                 'number'],
         ['geocoderMatchCode',            'string'],
         ['geocoderLocationCode',         'string'],
         ['recordStatusCode',             'string'],
         ['isActive',                     'number']
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