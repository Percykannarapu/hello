/** A TARGETING domain class representing the table: SDE.AM_PROFILES */
export class AmProfile
{
   public pk:               number;                /// Pk
   public group:            number;                /// Fk Group
   public createDate:       Date;                  /// Create Date
   public name:             string;                /// Name
   public description:      string;                /// Description
   public clientId:         string;                /// Client Id
   public methAcces:        number;                /// Meth Access
   public methAnalysi:      string;                /// Meth Analysis
   public methDistribution: string;                /// Meth Distribution
   public methSeason:       string;                /// Meth Season
   public taSource:         number;                /// Ta Source
   public xmlVariable:      string;                /// Xml Variables
   public xmlTradearea:     string;                /// Xml Tradearea
   public xmlSicquery:      string;                /// Xml Sicquery
   public modifyDate:       Date;                  /// Modify Date

   // SDE.AM_PROFILES - MANY TO ONE RELATIONSHIP MEMBERS
   // --------------------------------------------------
//   public createUser:       AmUser;                /// Am Users
//   public modifyUser:       AmUser;                /// Am Users

   // SDE.AM_PROFILES - ONE TO MANY RELATIONSHIP MEMBERS
   // --------------------------------------------------
//   public advertiserInfos:  Set<AdvertiserInfo>;   /// Set of advertiserInfos related to this AmProfile
//   public mediaPlans:       Set<MediaPlan>;        /// Set of mediaPlans related to this AmProfile
//   public amSites:          Set<AmSite>;           /// Set of amSites related to this AmProfile

   constructor() {}

   public toString = () => JSON.stringify(this, null, '   ');
}