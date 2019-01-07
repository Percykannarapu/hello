/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_MEDIA_PLANS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModel, DAOBaseStatus, transient } from './../../api/models/BaseModel';
import { AdvertiserInfo } from './AdvertiserInfo';
import { MediaPlanGroup } from './MediaPlanGroup';
import { AmProfile } from '../../targeting/models/AmProfile';
import { MediaPlanCommonMbu } from './MediaPlanCommonMbu';
import { MediaPlanLineDetail } from './MediaPlanLineDetail';
import { MediaPlanLine } from './MediaPlanLine';
import { CbxReport } from './CbxReport';
import { Goal } from './Goal';
import { Objective } from './Objective'
import { ProductAllocation } from './ProductAllocation';
import { TargetAudiencePref } from './TargetAudiencePref';

export class MediaPlan extends BaseModel
{
   public mediaPlanId:       number;            /// Primary key identifying a particular plan
   public createUser:        number;            /// User to create the row
   public createDate:        Date;              /// Date/Time row was created
   public modifyUser:        number;            /// User to modify the row
   public modifyDate:        Date;              /// Date/Time row was modified
   public amProfile:         AmProfile;         /// Profile ID
   public description:       string;            /// Description of the media plan
   public isActive:          boolean;           /// 1 = Active, 0 = InActive
   public cgmId:             number;            /// Foreign key to cbx_geofootprint_master.cgm_id
   public advertiserInfo:    AdvertiserInfo;    /// Foreign key to cbx_advertiser_info.advertiser_info_id
   public isCurrent:         boolean;           /// 1 = Current plan for the fk_advertiser_info_id, 0 = Not Current
   public statusCode:        string;            /// Current status of the plan
   public purgedFlag:        string;            /// Logical purge flag
   public mediaPlanGroupId:  number;            /// Fk Media Plan Group Id
   public isPrimary:         boolean;           /// Flag to indicate if the mediaPlan is Primary

   public goal:              Goal;              /// Many to one relationship with CbxGoal

   public objective:         Objective;         /// Many to one relationship with CbxObjective

   // ----------------------------------------------------------------------------
   // ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public commonMbus:               Array<MediaPlanCommonMbu> = new Array<MediaPlanCommonMbu>();
   public lines:                    Array<MediaPlanLine> = new Array<MediaPlanLine>();
   public reports:                  Array<CbxReport> = new Array<CbxReport>();
   // ----------------------------------------------------------------------------

   // ----------------------------------------------------------------------------
   // ADDITIONAL ONE TO MANY RELATIONSHIP MEMBERS
   // ----------------------------------------------------------------------------
   public productAllocations:       Array<ProductAllocation> = new Array<ProductAllocation>();
   public targetAudiencePrefs:      Array<TargetAudiencePref> = new Array<TargetAudiencePref>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed as it is a reference to the parent */
   @transient public mediaPlanGroup:         MediaPlanGroup;              /// Cbx Media Plan Groups

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<MediaPlan>) {
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
      // Ask the children to set the tree property
      this.commonMbus.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.lines.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.reports.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.productAllocations.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.targetAudiencePrefs.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.commonMbus.forEach(fe => fe.removeTreeProperty(propName   ));
      this.lines.forEach(fe => fe.removeTreeProperty(propName   ));
      this.reports.forEach(fe => fe.removeTreeProperty(propName   ));
      this.productAllocations.forEach(fe => fe.removeTreeProperty(propName   ));
      this.targetAudiencePrefs.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.commonMbus = (this.commonMbus||[]).map(ma => new MediaPlanCommonMbu(ma));
      this.lines = (this.lines||[]).map(ma => new MediaPlanLine(ma));
      this.reports = (this.reports||[]).map(ma => new CbxReport(ma));
      this.productAllocations = (this.productAllocations||[]).map(ma => new ProductAllocation(ma));
      this.targetAudiencePrefs = (this.targetAudiencePrefs||[]).map(ma => new TargetAudiencePref(ma));

      // Push this as transient parent to children
      this.commonMbus.forEach(fe => fe.mediaPlan = this);
      this.lines.forEach(fe => fe.mediaPlan = this);
      this.reports.forEach(fe => fe.mediaPlan = this);

      // Ask the children to convert into models
      this.commonMbus.forEach(fe => fe.convertToModel());
      this.lines.forEach(fe => fe.convertToModel());
      this.reports.forEach(fe => fe.convertToModel());
      this.productAllocations.forEach(fe => fe.convertToModel());
      this.targetAudiencePrefs.forEach(fe => fe.convertToModel());

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
         ['mediaPlanId',             'number'],
         ['createUser',              'number'],
         ['createDate',              'Date'],
         ['modifyUser',              'number'],
         ['modifyDate',              'Date'],
         ['description',             'string'],
         ['isActive',                'boolean'],
         ['cgmId',                   'number'],
         ['isCurrent',               'boolean'],
         ['purgedFlag',              'string'],
         ['isPrimary',               'boolean']
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
         ['advertiserInfo',          'AdvertiserInfo'],
         ['mediaPlanGroup',          'MediaPlanGroup'],
         ['status',                  'Status'],
         ['amProfile',               'AmProfile'],

         // TRANSITORY MANY TO ONE RELATIONSHIP MEMBERS
         ['mediaPlanGroup',          'MediaPlanGroup'],
         ['status',                  'Status'],

         // TRANSITORY ONE TO MANY RELATIONSHIP MEMBERS
         ['logTbl',                  'Array<LogTbl>'],
         ['mpCommonMediaOption',     'Array<MpCommonMediaOption>'],
         ['mpInputsTmp',             'Array<MpInputsTmp>'],
         ['output',                  'Array<Output>'],
      ]);
   }

   /**
    * Returns the class as a string.
    *
    * @returns A string containing the class data.
    */
   public toString = () => JSON.stringify(this, null, '   ');

}