/** A TARGETING domain class representing the table: IMPOWER.IMP_PROJECTS */
import { ClientIdentifierType } from '../../mediaexpress/models/ClientIdentifierType';
import { ConsumerPurchasingFreq } from '../../mediaexpress/models/ConsumerPurchasingFreq';
import { Goal } from '../../mediaexpress/models/Goal';
import { Objective } from '../../mediaexpress/models/Objective';

export class ImpProject
{
   public projectId:                   number;                      /// Primary Key
   public createUser:                  number;                      /// User to create the row
   public createDate:                  Date;                        /// Date/Time row was created
   public modifyUser:                  number;                      /// User to modify the row
   public modifyDate:                  Date;                        /// Date/Time row was modified
   public industryCategoryCode:        string;                      /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   public projectName:                 string;                      /// Project Name
   public description:                 string;                      /// Notes/Description
   public ihwFrom:                     Date;                        /// In Home Week From
   public ihwTo:                       Date;                        /// In Home Week To
   public ihd:                         Date;                        /// In Home Day
   public totalBudget:                 number;                      /// Total budget populated into opt_i_trade_areas
   public clientIdentifierId:          number;                      /// Client identifier ID
   public clientIdentifierName:        string;                      /// Client identifier name
   public customerNumber:              string;                      /// Customer number
   public preferredIhDate:             Date;                        /// Preferred In Home Date
   public afterIhdIsPreferred:         number;                      /// After In Home Date is preferred, 0=false, 1=true
   public sfdcRfpId:                   string;                      /// The Salesforce Request For Proposal id (18 character UID)
   public sfdcRfpName:                 string;                      /// Sdfc Request for Proposal Name
   public sfdcMediaPlanId:             string;                      /// The Salesforce media plan id (18 character UID)
   public sdfcNotificationId:          string;                      /// Sdfc Notification Id
   public isValidated:                 number;                      /// UI validation flag
   public isSingleDate:                number;                      /// Determines if using shared hhc possible (1) or scheduled
   public isMustCover:                 number;                      /// When MBU has a home_geo and UI says is_must_cover, exclude the mbu_score filter
   public isExcludePob:                number;                      /// Indicates if POB is excluded.  Used in meets_var_filter calculation
   public isDollarBudget:              number;                      /// Dollar Budget flag
   public isCircBudget:                number;                      /// Circ Budget flag
   public isRunAvail:                  number;                      /// Global Flag to check if MAA run Avails should occur
   public isHardPdi:                   number;                      /// Is hard pdi, 0=false, 1=true
   public isActive:                    number;                      /// 1 = Active, 0 = Inactive

   // IMPOWER.IMP_PROJECTS - MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------------------
   public clientIdentifierTypeCode:    ClientIdentifierType;        /// Cbx Client Identifier Types
   public consumerPurchFreqCode:       ConsumerPurchasingFreq;      /// Cbx Consumer Purchasing Freqs
   public goalCode:                    Goal;                        /// Cbx Goals
   public objectiveCode:               Objective;                   /// Cbx Objectives

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data: ImpProject | {} = {}) {
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
         ['projectId',                    'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['industryCategoryCode',         'string'],
         ['projectName',                  'string'],
         ['description',                  'string'],
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
         ['clientIdentifierTypeCode',     'ClientIdentifierType'],
         ['consumerPurchFreqCode',        'ConsumerPurchasingFreq'],
         ['goalCode',                     'Goal'],
         ['objectiveCode',                'Objective']
         ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');
}