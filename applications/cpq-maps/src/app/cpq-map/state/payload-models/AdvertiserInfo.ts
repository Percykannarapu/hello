/** A MEDIAEXPRESS domain class representing the table: CBX.CBX_ADVERTISER_INFO
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { BaseModelPayload } from './BaseModel';
import { AmProfilePayload } from './AmProfile';

export interface AdvertiserInfoPayload extends BaseModelPayload
{
   advertiserInfoId:          number;         /// Primary Key
   createUser:                number;         /// User to create the row
   createDate:                Date;           /// Date/Time row was created
   modifyUser:                number;         /// User to modify the row
   modifyDate:                Date;           /// Date/Time row was modified
   industryCategoryCode:      string;         /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   consumerPurchFreqCode:     string;         /// Consumer purchasing frequency (CPG, Ritual, Reminder, Research)
   objectiveCode:             string;         /// Coverage objective. An input for optimization
   isActive:                  boolean;        /// 1 = Active, 0 = Inactive
   ihwFrom:                   Date;           /// In Home Week From
   ihwTo:                     Date;           /// In Home Week To
   ihd:                       Date;           /// In Home Day
   isSingleDate:              boolean;        /// Determines if using shared hhc possible (1) or scheduled
   isMustCover:               boolean;        /// When MBU has a home_geo and UI says is_must_cover, exclude the mbu_score filter
   isExcludePob:              boolean;        /// Indicates if POB is excluded.  Used in meets_var_filter calculation
   totalBudget:               number;         /// Total budget populated into opt_i_trade_areas
   amProfile:                 AmProfilePayload;      /// The crossbow profile ID
   clientIdentifierTypeCode:  string;         /// The client identifier type (OPPORTUNITY_ID, CAR_LIST, CLIENT_ID, ect.)
   clientIdentifierId:        number;         /// Client identifier ID
   clientIdentifierName:      string;         /// Client identifier name
   customerNumber:            string;         /// Customer number
   isValidated:               boolean;        /// UI validation flag
   preferredIhDate:           Date;           /// Preferred In Home Date
   afterIhdIsPreferred:       number;         /// After In Home Date is preferred, 0=false, 1=true
   isRunAvail:                boolean;        /// Global Flag to check if MAA run Avails should occur
   isHardPdi:                 boolean;        /// Is hard pdi, 0=false, 1=true
   sfdcRfpId:                 string;         /// The Salesforce Request For Proposal id (18 character UID)
   sfdcMediaPlanId:           string;         /// The Salesforce media plan id (18 character UID)
   sdfcNotificationId:        string;         /// Sdfc Notification Id
   mediaPlanGroupId:          number;         /// Fk Media Plan Group Id
   sfdcRfpName:               string;
   

}