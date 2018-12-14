import { BaseModelState, parseStatus } from './base-model-state';
import { ImpProjectPayload } from '../../payload-models/imp-project-payload';

export class ImpProjectState extends BaseModelState {
  public projectId:                 number;         /// Primary Key
  public createUser:                number;         /// User to create the row
  public createDate:                Date;           /// Date/Time row was created
  public modifyUser:                number;         /// User to modify the row
  public modifyDate:                Date;           /// Date/Time row was modified
  public clientIdentifierTypeCode:  string;         /// The client identifier type (OPPORTUNITY_ID, CAR_LIST, CLIENT_ID, ect.)
  public consumerPurchFreqCode:     string;         /// Consumer purchasing frequency (CPG, Ritual, Reminder, Research)
  public goalCode:                  string;         /// Campaign goal. An input for optimization
  public objectiveCode:             string;         /// Coverage objective. An input for optimization
  public industryCategoryCode:      string;         /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
  public projectName:               string;         /// Project Name
  public description:               string;         /// Notes/Description
  public methAnalysis:              string;
  public ihwFrom:                   Date;           /// In Home Week From
  public ihwTo:                     Date;           /// In Home Week To
  public ihd:                       Date;           /// In Home Day
  public totalBudget:               number;         /// Total budget populated into opt_i_trade_areas
  public clientIdentifierId:        number;         /// Client identifier ID
  public clientIdentifierName:      string;         /// Client identifier name
  public customerNumber:            string;         /// Customer number
  public preferredIhDate:           Date;           /// Preferred In Home Date
  public afterIhdIsPreferred:       number;         /// After In Home Date is preferred, 0=false, 1=true
  public sfdcRfpId:                 string;         /// The Salesforce Request For Proposal id (18 character UID)
  public sfdcRfpName:               string;         /// Sdfc Request for Proposal Name
  public sfdcMediaPlanId:           string;         /// The Salesforce media plan id (18 character UID)
  public sdfcNotificationId:        string;         /// Sdfc Notification Id
  public isValidated:               boolean;        /// UI validation flag
  public isSingleDate:              boolean;        /// Determines if using shared hhc possible (1) or scheduled
  public isMustCover:               boolean;        /// When MBU has a home_geo and UI says is_must_cover, exclude the mbu_score filter
  public isExcludePob:              boolean;        /// Indicates if POB is excluded.  Used in meets_var_filter calculation
  public isDollarBudget:            boolean;        /// Dollar Budget flag
  public isCircBudget:              boolean;        /// Circ Budget flag
  public isRunAvail:                boolean;        /// Global Flag to check if MAA run Avails should occur
  public isHardPdi:                 boolean;        /// Is hard pdi, 0=false, 1=true
  public isActive:                  boolean;        /// 1 = Active, 0 = Inactive
  public isIncludeValassis:         boolean;        /// 1 = Include Valassis Geographies, 0 = Do not
  public isIncludeAnne:             boolean;        /// 1 = Include Anne Geographies, 0 = Do not
  public isIncludeSolo:             boolean;        /// 1 = Include Solo Geographies, 0 = Do not
  public isIncludeNonWeekly:        boolean;        /// 1 = Include Non Weekly Geographies, 0 = Do not
  public projectTrackerId:          number;         /// FK to IMS.ims_projects.project_id
  public estimatedBlendedCpm:       number;         /// Blended CPM
  public smValassisCpm:             number;         /// CPM defined by VALASSIS
  public smAnneCpm:                 number;         /// CPM defined by ANNE
  public smSoloCpm:                 number;         /// CPM defined by SOLO
  public radProduct:                string;         /// RAD_PRODUCT
  public taSiteMergeType:           string;         /// Trade area merge type for sites
  public taCompetitorMergeType:     string;         /// Trade area merge type for competitors
  public audTaMinRadiu:             number;         /// Audience Trade Area minimum must cover radius (in miles)
  public audTaMaxRadiu:             number;         /// Audience Trade Area minimum must cover radius (in miles)
  public audTaVarPk:                number;         /// ID of the driving variable to generate the audience trade area (CATEGORY_ID for online audiences and PK for offline/TDA)
  public audTaVarSource:            string;         /// Data Source (ex: TDA, Interest, In-Market, Pixel, Polk, IMS, IRI Data)
  public audTaVarWeight:            number;         /// Weight percentage of the variable vs. distance
  public audTaIndexBase:            string;         /// Whether National or DMA index scoring base is used to generate the audience trade area
  public audTaIsMustCover:          number;         /// Whether to select all geography in the minimum audience trade area radius by default

  // ----------------------------------------------------------------------------
  // ONE TO MANY RELATIONSHIP MEMBERS
  // ----------------------------------------------------------------------------
  public impGeofootprintMasters:      Array<number> = [];
  public impProjectPrefs:             Array<number> = [];
  public impProjectVars:              Array<number> = [];
  // ----------------------------------------------------------------------------

  // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
  constructor(data?: Partial<ImpProjectPayload>) {
    super();
    const baseStatus = { baseStatus: parseStatus(data.baseStatus) };
    const relationships = {
      impGeofootprintMasters: (data.impGeofootprintMasters || []).map(m => m.cgmId),
      impProjectPrefs: (data.impProjectPrefs || []).map(p => p.projectPrefId),
      impProjectVars: (data.impProjectVars || []).map(v => v.pvId)
    };
    Object.assign(this, data, baseStatus, relationships);
  }
}
