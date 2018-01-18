/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_SITES
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpClientSite } from '../../client/models/ImpClientSite';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpProject } from './ImpProject';

export class ImpGeofootprintSite
{
   public gsId:                 number;                     /// Primary key, uniquely identifying a sites row
   public siteName:             string;                     /// Name of the site
   public siteIdDisplay:        string;                     /// Site ID displayed on UI
   public xcoord:               number;                     /// X Location coordinate
   public ycoord:               number;                     /// Y Location coordinate
   public homeGeocode:          string;                     /// Identifies the site home geography
   public homeGeoName:          string;                     /// Name of the home geography
   public geoProfileId:         number;                     /// Identifies the geography profile
   public geoProfileTypeAbbr:   string;                     /// Type of geo profile
   public siteFranchisee:       string;                     /// Store franchisee
   public siteAddres:           string;                     /// Store address
   public siteCity:             string;                     /// Store city
   public siteState:            string;                     /// Store state
   public siteZip:              string;                     /// Store zip code
   public siteSortOrder:        number;                     /// Site sort order

   // IMPOWER.IMP_GEOFOOTPRINT_SITES - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------------------------
   public clientSiteId:         ImpClientSite;              /// Client Library Repository of Client Sites
   public cgmId:                ImpGeofootprintMaster;      /// Geofootprint master table for IMPower.
   public projectId:            ImpProject;                 /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintSite | {} = {}) {
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
         ['gsId',                  'number'],
         ['siteName',              'string'],
         ['siteIdDisplay',         'string'],
         ['xcoord',                'number'],
         ['ycoord',                'number'],
         ['homeGeocode',           'string'],
         ['homeGeoName',           'string'],
         ['geoProfileId',          'number'],
         ['geoProfileTypeAbbr',    'string'],
         ['siteFranchisee',        'string'],
         ['siteAddres',            'string'],
         ['siteCity',              'string'],
         ['siteState',             'string'],
         ['siteZip',               'string'],
         ['siteSortOrder',         'number']
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
         ['clientSiteId',          'ImpClientSite'],
         ['cgmId',                 'ImpGeofootprintMaster'],
         ['projectId',             'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}