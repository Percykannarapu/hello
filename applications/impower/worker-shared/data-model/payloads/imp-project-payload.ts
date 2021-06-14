import { BaseModelPayload } from './base-model-payload';
import { ImpGeofootprintMasterPayload } from './imp-geofootprint-master-payload';
import { ImpProjectPrefPayload } from './imp-project-pref-payload';
import { ImpProjectVarPayload } from './imp-project-var-payload';

export interface ImpProjectPayload extends BaseModelPayload {
   projectId:                 number;         /// Primary Key
   createUser:                number;         /// User to create the row
   createDate:                number;           /// Date/Time row was created
   modifyUser:                number;         /// User to modify the row
   modifyDate:                number;           /// Date/Time row was modified
   clientIdentifierTypeCode:  string;         /// The client identifier type (OPPORTUNITY_ID, CAR_LIST, CLIENT_ID, ect.)
   consumerPurchFreqCode:     string;         /// Consumer purchasing frequency (CPG, Ritual, Reminder, Research)
   goalCode:                  string;         /// Campaign goal. An input for optimization
   objectiveCode:             string;         /// Coverage objective. An input for optimization
   industryCategoryCode:      string;         /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   projectName:               string;         /// Project Name
   description:               string;         /// Notes/Description
   methAnalysis:              string;
   ihwFrom:                   number;           /// In Home Week From
   ihwTo:                     number;           /// In Home Week To
   ihd:                       number;           /// In Home Day
   totalBudget:               number;         /// Total budget populated into opt_i_trade_areas
   clientIdentifierId:        number;         /// Client identifier ID
   clientIdentifierName:      string;         /// Client identifier name
   customerNumber:            string;         /// Customer number
   preferredIhDate:           number;           /// Preferred In Home Date
   afterIhdIsPreferred:       number;         /// After In Home Date is preferred, 0=false, 1=true
   sfdcRfpId:                 string;         /// The Salesforce Request For Proposal id (18 character UID)
   sfdcRfpName:               string;         /// Sdfc Request for Proposal Name
   sfdcMediaPlanId:           string;         /// The Salesforce media plan id (18 character UID)
   sdfcNotificationId:        string;         /// Sdfc Notification Id
   isValidated:               boolean;        /// UI validation flag
   isSingleDate:              boolean;        /// Determines if using shared hhc possible (1) or scheduled
   isMustCover:               boolean;        /// When MBU has a home_geo and UI says is_must_cover, exclude the mbu_score filter
   isExcludePob:              boolean;        /// Indicates if POB is excluded.  Used in meets_var_filter calculation
   isDollarBudget:            boolean;        /// Dollar Budget flag
   isCircBudget:              boolean;        /// Circ Budget flag
   isRunAvail:                boolean;        /// Global Flag to check if MAA run Avails should occur
   isHardPdi:                 boolean;        /// Is hard pdi, 0=false, 1=true
   isActive:                  boolean;        /// 1 = Active, 0 = Inactive
   isIncludeValassis:         boolean;        /// 1 = Include Valassis Geographies, 0 = Do not
   isIncludeAnne:             boolean;        /// 1 = Include Anne Geographies, 0 = Do not
   isIncludeSolo:             boolean;        /// 1 = Include Solo Geographies, 0 = Do not
   isIncludeNonWeekly:        boolean;        /// 1 = Include Non Weekly Geographies, 0 = Do not
   projectTrackerId:          number;         /// FK to IMS.ims_projects.project_id
   estimatedBlendedCpm:       number;         /// Blended CPM
   smValassisCpm:             number;         /// CPM defined by VALASSIS
   smAnneCpm:                 number;         /// CPM defined by ANNE
   smSoloCpm:                 number;         /// CPM defined by SOLO
   radProduct:                string;         /// RAD_PRODUCT
   taSiteMergeType:           string;         /// Trade area merge type for sites
   taCompetitorMergeType:     string;         /// Trade area merge type for competitors
   audTaMinRadiu:             number;         /// Audience Trade Area minimum must cover radius (in miles)
   audTaMaxRadiu:             number;         /// Audience Trade Area minimum must cover radius (in miles)
   audTaVarPk:                number;         /// ID of the driving variable to generate the audience trade area (CATEGORY_ID for online audiences and PK for offline/TDA)
   audTaVarSource:            string;         /// Data Source (ex: TDA, Interest, In-Market, Pixel, Polk, IMS, IRI Data)
   audTaVarWeight:            number;         /// Weight percentage of the variable vs. distance
   audTaIndexBase:            string;         /// Whether National or DMA index scoring base is used to generate the audience trade area
   audTaIsMustCover:          number;         /// Whether to select all geography in the minimum audience trade area radius by default

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
   impGeofootprintMasters:      Array<ImpGeofootprintMasterPayload>;
   impProjectPrefs:             Array<ImpProjectPrefPayload>;
   impProjectVars:              Array<ImpProjectVarPayload>;
  // ----------------------------------------------------------------------------
}
