import { BaseModel, DAOBaseStatus } from './../../api/models/BaseModel';
/** A TARGETING domain class representing the table: IMPOWER.IMP_PROJECTS
 **
 ** Generated from VAL_ENTITY_GEN - v2.01
 **/

import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ConsumerPurchasingFreq } from '../../mediaexpress/models/ConsumerPurchasingFreq';
import { Goal } from '../../mediaexpress/models/Goal';
import { Objective } from '../../mediaexpress/models/Objective';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';

export class ImpProject extends BaseModel
{
   public projectId:                   number;                        /// Primary Key
   public createUser:                  number;                        /// User to create the row
   public createDate:                  Date;                          /// Date/Time row was created
   public modifyUser:                  number;                        /// User to modify the row
   public modifyDate:                  Date;                          /// Date/Time row was modified
   public industryCategoryCode:        string;                        /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   public projectName:                 string;                        /// Project Name
   public description:                 string;                        /// Notes/Description
   public methAnalysis:                string;
   public ihwFrom:                     Date;                          /// In Home Week From
   public ihwTo:                       Date;                          /// In Home Week To
   public ihd:                         Date;                          /// In Home Day
   public totalBudget:                 number;                        /// Total budget populated into opt_i_trade_areas
   public clientIdentifierId:          number;                        /// Client identifier ID
   public clientIdentifierName:        string;                        /// Client identifier name
   public customerNumber:              string;                        /// Customer number
   public preferredIhDate:             Date;                          /// Preferred In Home Date
   public afterIhdIsPreferred:         number;                        /// After In Home Date is preferred, 0=false, 1=true
   public sfdcRfpId:                   string;                        /// The Salesforce Request For Proposal id (18 character UID)
   public sfdcRfpName:                 string;                        /// Sdfc Request for Proposal Name
   public sfdcMediaPlanId:             string;                        /// The Salesforce media plan id (18 character UID)
   public sdfcNotificationId:          string;                        /// Sdfc Notification Id
   public isValidated:                 boolean;                       /// UI validation flag
   public isSingleDate:                boolean;                       /// Determines if using shared hhc possible (1) or scheduled
   public isMustCover:                 boolean;                       /// When MBU has a home_geo and UI says is_must_cover, exclude the mbu_score filter
   public isExcludePob:                boolean;                       /// Indicates if POB is excluded.  Used in meets_var_filter calculation
   public isDollarBudget:              boolean;                       /// Dollar Budget flag
   public isCircBudget:                boolean;                       /// Circ Budget flag
   public isRunAvail:                  boolean;                       /// Global Flag to check if MAA run Avails should occur
   public isHardPdi:                   boolean;                       /// Is hard pdi, 0=false, 1=true
   public isActive:                    boolean;                       /// 1 = Active, 0 = Inactive
   public isIncludeValassis:           boolean;                       /// 1 = include valassis geographies, 0 = do not
   public isIncludeAnne:               boolean;                       /// 1 = include anne geographies, 0 = do not
   public isIncludeSolo:               boolean;                       /// 1 = include solo geographies, 0 = do not
   public isIncludeNonWeekly:          boolean;                       /// 1 = include non weekly geographies, 0 = do not
   public projectTrackerId:            number;                        /// fk to ims.ims_projects.project_id
      

   // IMPOWER.IMP_PROJECTS - MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------------------
//   public clientIdentifierType:        ClientIdentifierType;          /// Cbx Client Identifier Types
   public clientIdentifierTypeCode:    string;

   // We need to make the typescript mirror what the base object is doing
//   public consumerPurchasingFreq:      ConsumerPurchasingFreq;        /// Cbx Consumer Purchasing Freqs
   public consumerPurchFreqCode:       string;
//   public goal:                        Goal;                          /// Cbx Goals
   public goalCode:                    string;
//   public objective:                   Objective;                     /// Cbx Objectives
   public objectiveCode:               string;

   // IMPOWER.IMP_PROJECTS - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
   // ----------------------------------------------------------------------
   public impGeofootprintMasters:      Array<ImpGeofootprintMaster>;    /// Set of impGeofootprintMasters related to this ImpProject
//   public impGeofootprintMaster:       ImpGeofootprintMaster;

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?:Partial<ImpProject>) {
      super();
//      this.clear();
      Object.assign(this, data);
   }

   public clear() 
   {
      this.dirty                    = true;
      this.baseStatus               = DAOBaseStatus.INSERT;

      this.projectId                = null;
      this.createUser               = null;
      this.createDate               = null;
      this.modifyUser               = null;
      this.modifyDate               = null;
      this.industryCategoryCode     = null;
      this.projectName              = null;
      this.description              = null;
      this.methAnalysis             = null;
      this.ihwFrom                  = null;
      this.ihwTo                    = null;
      this.ihd                      = null;
      this.totalBudget              = null;
      this.clientIdentifierId       = null;
      this.clientIdentifierName     = null;
      this.customerNumber           = null;
      this.preferredIhDate          = null;
      this.afterIhdIsPreferred      = null;
      this.sfdcRfpId                = null;
      this.sfdcRfpName              = null;
      this.sfdcMediaPlanId          = null;
      this.sdfcNotificationId       = null;
      this.isValidated              = null;
      this.isSingleDate             = null;
      this.isMustCover              = null;
      this.isExcludePob             = null;
      this.isDollarBudget           = null;
      this.isCircBudget             = null;
      this.isRunAvail               = null;
      this.isHardPdi                = null;
      this.isActive                 = null;
      this.isIncludeValassis        = null;
      this.isIncludeAnne            = null;
      this.isIncludeSolo            = null;
      this.isIncludeNonWeekly       = null;
      this.projectTrackerId         = null;
         
   
      // IMPOWER.IMP_PROJECTS - MANY TO ONE RELATIONSHIP MEMBERS
      // -------------------------------------------------------
      this.clientIdentifierTypeCode = null;
      this.consumerPurchFreqCode    = null;
      this.goalCode                 = null;
      this.objectiveCode            = null;
   
      // IMPOWER.IMP_PROJECTS - ONE TO MANY RELATIONSHIP MEMBERS (TO THE CLASS)
      // ----------------------------------------------------------------------
      this.impGeofootprintMasters   = null;
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
         ['projectId',                    'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['industryCategoryCode',         'string'],
         ['projectName',                  'string'],
         ['description',                  'string'],
         ['methAnalysis',                 'string'],
         ['ihwFrom',                      'Date'],
         ['ihwTo',                        'Date'],
         ['ihd',                          'Date'],
         ['totalBudget',                  'number'],
         ['clientIdentifierId',           'number'],
         ['clientIdentifierName',         'string'],
         ['customerNumber',               'string'],
         ['preferredIhDate',              'Date'],
         ['afterIhdIsPreferred',          'number'],
         ['sfdcRfpId',                    'string'],
         ['sfdcRfpName',                  'string'],
         ['sfdcMediaPlanId',              'string'],
         ['sdfcNotificationId',           'string'],
         ['isValidated',                  'number'],
         ['isSingleDate',                 'number'],
         ['isMustCover',                  'number'],
         ['isExcludePob',                 'number'],
         ['isDollarBudget',               'number'],
         ['isCircBudget',                 'number'],
         ['isRunAvail',                   'number'],
         ['isHardPdi',                    'number'],
         ['isActive',                     'number'],
         ['isIncludeValassis',            'number'],
         ['isIncludeAnne',                'number'],
         ['isIncludeSolo',                'number'],
         ['isIncludeNonWeekly',           'number'],
         ['projectTrackerId',             'number'],
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
         ['consumerPurchasingFreq',       'ConsumerPurchasingFreq'],
         ['goal',                         'Goal'],
         ['objective',                    'Objective']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}