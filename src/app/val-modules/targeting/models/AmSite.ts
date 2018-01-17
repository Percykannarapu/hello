import { AmProfile } from './AmProfile';
/** A TARGETING domain class representing the table: SDE.AM_SITES */

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
         ['grouping',          'string'],
         // MANY TO ONE RELATIONSHIP MEMBERS
         ['profile',           'AmProfile']
         ]);
   }

   public toString = () => JSON.stringify(this, null, '   ');
}