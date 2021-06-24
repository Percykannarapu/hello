/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_ADVERTISER_INFO
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from '../../api/models/BaseModel';
import { Goal } from './Goal';
import { MediaPlanGroup } from './MediaPlanGroup';
import { Objective } from './Objective';
import { AmProfile } from '../../targeting/models/AmProfile';
import { MediaPlan } from './MediaPlan';
import { MediaPlanCommonMbu } from './MediaPlanCommonMbu';
import { MediaPlanLineDetail } from './MediaPlanLineDetail';
import { MediaPlanLine } from './MediaPlanLine';
import { CbxReport } from './CbxReport';
import { ProductAllocation } from './ProductAllocation';
import { TargetAudiencePref } from './TargetAudiencePref';

export class AdvertiserInfo extends BaseModel
{
   public advertiserInfoId:          number;         /// Primary Key
   public createUser:                number;         /// User to create the row
   public createDate:                Date;           /// Date/Time row was created
   public modifyUser:                number;         /// User to modify the row
   public modifyDate:                Date;           /// Date/Time row was modified
   public industryCategoryCode:      string;         /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   public consumerPurchFreqCode:     string;         /// Consumer purchasing frequency (CPG, Ritual, Reminder, Research)
   public objectiveCode:             string;         /// Coverage objective. An input for optimization
   public isActive:                  boolean;        /// 1 = Active, 0 = Inactive
   public ihwFrom:                   Date;           /// In Home Week From
   public ihwTo:                     Date;           /// In Home Week To
   public ihd:                       Date;           /// In Home Day
   public isSingleDate:              boolean;        /// Determines if using shared hhc possible (1) or scheduled
   public isMustCover:               boolean;        /// When MBU has a home_geo and UI says is_must_cover, exclude the mbu_score filter
   public isExcludePob:              boolean;        /// Indicates if POB is excluded.  Used in meets_var_filter calculation
   public totalBudget:               number;         /// Total budget populated into opt_i_trade_areas
   public amProfile:                 AmProfile;      /// The crossbow profile ID
   public clientIdentifierTypeCode:  string;         /// The client identifier type (OPPORTUNITY_ID, CAR_LIST, CLIENT_ID, ect.)
   public clientIdentifierId:        number;         /// Client identifier ID
   public clientIdentifierName:      string;         /// Client identifier name
   public customerNumber:            string;         /// Customer number
   public isValidated:               boolean;        /// UI validation flag
   public preferredIhDate:           Date;           /// Preferred In Home Date
   public afterIhdIsPreferred:       number;         /// After In Home Date is preferred, 0=false, 1=true
   public isRunAvail:                boolean;        /// Global Flag to check if MAA run Avails should occur
   public isHardPdi:                 boolean;        /// Is hard pdi, 0=false, 1=true
   public sfdcRfpId:                 string;         /// The Salesforce Request For Proposal id (18 character UID)
   public sfdcMediaPlanId:           string;         /// The Salesforce media plan id (18 character UID)
   public sdfcNotificationId:        string;         /// Sdfc Notification Id
   public mediaPlanGroupId:          number;         /// Fk Media Plan Group Id
   public sfdcRfpName:               string;
   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public goal:                        Goal;                            /// Cbx Goals

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlanGroup:              MediaPlanGroup;                  /// Cbx Media Plan Groups

   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public objective:                   Objective;                       /// Cbx Objectives


   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getMediaPlans(): ReadonlyArray<MediaPlan> {
      let _result: Array<MediaPlan> = new Array<MediaPlan>();
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getMediaPlanCommonMbus(): ReadonlyArray<MediaPlanCommonMbu> {
      let _result: Array<MediaPlanCommonMbu> = new Array<MediaPlanCommonMbu>();
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   /*getMpMbuDtls(): ReadonlyArray<MediaPlanLineDetail> {
      let _result: Array<MpMbuDtl> = new Array<MediaPlanLineDetail>();
      (this.mediaPlanGroups||[]).forEach(mediaPlanGroup => (mediaPlanGroup.statuses||[])
                                .forEach(status => (status.objectives||[])
                                .forEach(objective => (objective.mediaPlanGroups||[])
                                .forEach(mediaPlanGroup => (mediaPlanGroup.products||[])
                                .forEach(product => (product.mediaPlanGroups||[])
                                .forEach(mediaPlanGroup => (mediaPlanGroup.wrapPagePositions||[])
                                .forEach(wrapPagePosition => (wrapPagePosition.mediaPlans||[])
                                .forEach(mediaPlan => (mediaPlan.advertiserInfos||[])
                                .forEach(advertiserInfo => (advertiserInfo.pmProfiles||[])
                                .forEach(pmProfile => (pmProfile.epInHomeWeeks||[])
                                .forEach(epInHomeWeek => (epInHomeWeek.epAvailabilities||[])
                                .forEach(epAvailability => (epAvailability.mpMbuHdrs||[])
                                .forEach(mpMbuHdr => (_result.push(...mpMbuHdr.mpMbuDtls||[])))))))))))))));
      return _result;
   }*/

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getMediaPlanLines(): ReadonlyArray<MediaPlanLine> {
      let _result: Array<MediaPlanLine> = new Array<MediaPlanLine>();
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getCbxReports(): ReadonlyArray<CbxReport> {
      let _result: Array<CbxReport> = new Array<CbxReport>();
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getProductAllocations(): ReadonlyArray<ProductAllocation> {
      let _result: Array<ProductAllocation> = new Array<ProductAllocation>();
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   getTargetAudiencePrefs(): ReadonlyArray<TargetAudiencePref> {
      let _result: Array<TargetAudiencePref> = new Array<TargetAudiencePref>();
      return _result;
   }


   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<AdvertiserInfo>) {
      super();
      Object.assign(this, data);
   }

   // Set tree property and push it down the hierarchy
   public setTreeProperty(propName: string, propValue: any)
   {
      if (!this.hasOwnProperty(propName)) {
         Object.defineProperty(this, propName, {
            enumerable: false,
            configurable: true,
            writable: true
         });
      }
      this[propName] = propValue;
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
   }

   // Convert JSON objects into Models
   public convertToModel()
   {

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
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
         ['advertiserInfoId',             'number'],
         ['createUser',                   'number'],
         ['createDate',                   'Date'],
         ['modifyUser',                   'number'],
         ['modifyDate',                   'Date'],
         ['isActive',                     'boolean'],
         ['ihwFrom',                      'Date'],
         ['ihwTo',                        'Date'],
         ['ihd',                          'Date'],
         ['isSingleDate',                 'boolean'],
         ['isMustCover',                  'boolean'],
         ['isExcludePob',                 'boolean'],
         ['totalBudget',                  'number'],
         ['clientIdentifierId',           'number'],
         ['clientIdentifierName',         'string'],
         ['customerNumber',               'string'],
         ['isValidated',                  'boolean'],
         ['preferredIhDate',              'Date'],
         ['afterIhdIsPreferred',          'number'],
         ['isRunAvail',                   'boolean'],
         ['isHardPdi',                    'boolean'],
         ['sfdcRfpId',                    'string'],
         ['sfdcMediaPlanId',              'string'],
         ['sdfcNotificationId',           'string'],
         ['sfdcRfpName',                  'string']
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
         ['objective',                    'Objective'],
         ['amProfile',                    'AmProfile'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['goal',                         'Goal'],
         ['objective',                    'Objective'],

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['mediaPlan',                    'Array<MediaPlan>'],
         ['mediaPlanCommonMbu',           'Array<MediaPlanCommonMbu>'],
         ['mediaPlanLineDetail',          'Array<MediaPlanLineDetail>'],
         ['mediaPlanLine',                'Array<MediaPlanLine>'],
         ['cbxReport',                    'Array<CbxReport>'],
         ['productAllocation',            'Array<ProductAllocation>'],
         ['targetAudiencePref',           'Array<TargetAudiencePref>'],
      ]);
   }
}
