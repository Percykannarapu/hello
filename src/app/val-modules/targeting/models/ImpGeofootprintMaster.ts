/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_MASTER
 **
 ** Generated from VAL_ENTITY_GEN - v2.0
 **/

import { ImpProject } from './ImpProject';

export class ImpGeofootprintMaster
{
   public cgmId:                 number;                     /// Primary key identifying the current run for the profile.
   public summaryInd:            number;                     /// 1 = Summary, 0 = Not summary
   public allowDuplicate:        number;                     /// Indicator for allowing duplicate geos
   public createdDate:           Date;                       /// Date/Time row was created
   public status:                string;                     /// Indicates success or failure of geofootprint creation
   public methAnalysi:           string;                     /// Method analysis level. ZIP or ATZ
   public methSeason:            string;                     /// Season
   public activeSiteCount:       number;                     /// Total number of active sites
   public totalSiteCount:        number;                     /// Total number of sites
   public isMarketBased:         number;                     /// 1 = Market based, 2 = Store based

   // IMPOWER.IMP_GEOFOOTPRINT_MASTER - MANY TO ONE RELATIONSHIP MEMBERS
   // ------------------------------------------------------------------
   public projectId:             ImpProject;                 /// Captures Project information from the UI

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpGeofootprintMaster | {} = {}) {
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
         ['cgmId',                  'number'],
         ['summaryInd',             'number'],
         ['allowDuplicate',         'number'],
         ['createdDate',            'Date'],
         ['status',                 'string'],
         ['methAnalysi',            'string'],
         ['methSeason',             'string'],
         ['activeSiteCount',        'number'],
         ['totalSiteCount',         'number'],
         ['isMarketBased',          'number']
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
         ['projectId',              'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}