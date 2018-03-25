/** A TARGETING domain class representing the table: IMPOWER.IMP_GEOFOOTPRINT_MASTER
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ImpProject } from './ImpProject';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { BaseModel, DAOBaseStatus } from '../../api/models/BaseModel';

export class ImpGeofootprintMaster extends BaseModel
{
   public cgmId:                     number;                        /// Primary key identifying the current run for the profile.
   public summaryInd:                number;                        /// 1 = Summary, 0 = Not summary
   public allowDuplicate:            number;                        /// Indicator for allowing duplicate geos
   public createdDate:               Date;                          /// Date/Time row was created
   public status:                    string;                        /// Indicates success or failure of geofootprint creation
   public methAnalysis:              string;                        /// Method analysis level. ZIP or ATZ
   public methSeason:                string;                        /// Season
   public activeLocationCount:       number;                        /// Total number of active location
   public totalLocationCount:        number;                        /// Total number of location
   public isMarketBased:             boolean;                        /// 1 = Market based, 2 = Store based
   public isActive:                  boolean;                        /// Is Active

   // IMPOWER.IMP_GEOFOOTPRINT_MASTER - MANY TO ONE RELATIONSHIP MEMBERS
   // ------------------------------------------------------------------
   public impProject:                ImpProject;                    /// Captures Project information from the UI

   // IMPOWER.IMP_GEOFOOTPRINT_MASTER - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
   // ------------------------------------------------------------------
   public impGeofootprintLocations:  Array<ImpGeofootprintLocation>;  /// Set of impGeofootprintLocations related to this ImpGeofootprintMaster
   
   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpGeofootprintMaster>) {
      super();
//      this.clear();
      Object.assign(this, data);
   }

   public clear() 
   {
      this.dirty               = true;
      this.baseStatus          = DAOBaseStatus.INSERT;
      this.cgmId               = null;
      this.summaryInd          = null;
      this.allowDuplicate      = null;
      this.createdDate         = null;
      this.status              = null;
      this.methAnalysis        = null;
      this.methSeason          = null;
      this.activeLocationCount = null;
      this.totalLocationCount  = null;
      this.isMarketBased       = null;
      this.isActive            = null;
   
      // IMPOWER.IMP_GEOFOOTPRINT_MASTER - MANY TO ONE RELATIONSHIP MEMBERS
      // ------------------------------------------------------------------
//      this.impProject          = null;
   
      // IMPOWER.IMP_GEOFOOTPRINT_MASTER - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
      // ------------------------------------------------------------------
      this.impGeofootprintLocations = null;
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
         ['cgmId',                      'number'],
         ['summaryInd',                 'number'],
         ['allowDuplicate',             'number'],
         ['createdDate',                'Date'],
         ['status',                     'string'],
         ['methAnalysis',               'string'],
         ['methSeason',                 'string'],
         ['activeLocationCount',        'number'],
         ['totalLocationCount',         'number'],
         ['isMarketBased',              'number'],
         ['isActive',                   'number']
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
         ['impProject',                 'ImpProject']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}