/** A TARGETING domain class representing the table: SDE.AM_SITES */
import { AmProfile } from './AmProfile';

export class AmSite
{
   public pk:               number;                /// Pk
   public xcoord:           number;                /// Xcoord
   public ycoord:           number;                /// Ycoord
   public siteType:         number;                /// Site Type
   public siteId:           string;                /// Site Id
   public name:             string;                /// Name
   public owner:            string;                /// Owner
   public franchisee:       string;                /// Franchisee
   public address:          string;                /// Address
   public crossStreet:      string;                /// Cross Street
   public city:             string;                /// City
   public state:            string;                /// State
   public zip:              string;                /// Zip
   public taSource:         number;                /// Ta Source
   public xmlLocation:      string;                /// Xml Location
   public xmlTradearea:     string;                /// Xml Tradearea
   public createType:       number;                /// Create Type
   public grouping:         string;                /// Grouping

   // SDE.AM_SITES - MANY TO ONE RELATIONSHIP MEMBERS
   // -----------------------------------------------
   public profile:          AmProfile;             /// Crossbow Targeting profile

   constructor() {}

   /**
    * Produces a map of this classes fields and data types.
    * Used instead of reflection, which has limitations.
    *
    * @returns Map<field, type>
    */
   public static getFields () : Map<string, string>
   {
      return new Map([
         ['pk',                'number'],
         ['xcoord',            'number'],
         ['ycoord',            'number'],
         ['siteType',          'number'],
         ['siteId',            'string'],
         ['name',              'string'],
         ['owner',             'string'],
         ['franchisee',        'string'],
         ['address',           'string'],
         ['crossStreet',       'string'],
         ['city',              'string'],
         ['state',             'string'],
         ['zip',               'string'],
         ['taSource',          'number'],
         ['xmlLocation',       'string'],
         ['xmlTradearea',      'string'],
         ['createType',        'number'],
         ['grouping',          'string']
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
         ['profile',           'AmProfile']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}