/** An IMPTARGETING domain class representing the table: IMPOWER.IMP_PROJECTS
 **
 ** Generated from VAL_BASE_GEN - v1.06
 **/
import { ImpClientLocationTypeCodes } from '../../../../worker-shared/data-model/impower.data-model.enums';
import { BaseModel } from '../../api/models/BaseModel';
import { ImpGeofootprintGeo } from './ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from './ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from './ImpGeofootprintLocAttrib';
import { ImpGeofootprintMaster } from './ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from './ImpGeofootprintTradeArea';
import { ImpProjectPref } from './ImpProjectPref';
import { ImpProjectVar } from './ImpProjectVar';

export class ImpProject extends BaseModel
{

   // Can construct without params or as ({fieldA: 'xyz', fieldB: 123});
   constructor(data?: Partial<ImpProject>) {
      super();
      Object.assign(this, data);
   }
   public projectId:                 number;         /// Primary Key
   public createUser:                number;         /// User to create the row
   public createDate:                number;           /// Date/Time row was created
   public modifyUser:                number;         /// User to modify the row
   public modifyDate:                number;           /// Date/Time row was modified
   public clientIdentifierTypeCode:  string;         /// The client identifier type (OPPORTUNITY_ID, CAR_LIST, CLIENT_ID, ect.)
   public consumerPurchFreqCode:     string;         /// Consumer purchasing frequency (CPG, Ritual, Reminder, Research)
   public goalCode:                  string;         /// Campaign goal. An input for optimization
   public objectiveCode:             string;         /// Coverage objective. An input for optimization
   public industryCategoryCode:      string;         /// Industry Categories from IMO (QSR, Soft Goods, Home Improvement, etc.
   public projectName:               string;         /// Project Name
   public description:               string;         /// Notes/Description
   public methAnalysis:              string;
   public ihwFrom:                   number;           /// In Home Week From
   public ihwTo:                     number;           /// In Home Week To
   public ihd:                       number;           /// In Home Day
   public totalBudget:               number;         /// Total budget populated into opt_i_trade_areas
   public clientIdentifierId:        number;         /// Client identifier ID
   public clientIdentifierName:      string;         /// Client identifier name
   public customerNumber:            string;         /// Customer number
   public preferredIhDate:           number;           /// Preferred In Home Date
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
   public impGeofootprintMasters:      Array<ImpGeofootprintMaster> = new Array<ImpGeofootprintMaster>();
   public impProjectPrefs:             Array<ImpProjectPref> = new Array<ImpProjectPref>();
   public impProjectVars:              Array<ImpProjectVar> = new Array<ImpProjectVar>();
   // ----------------------------------------------------------------------------

   // -------------------------------------------
   // TRANSITORY ONE TO MANY RELATIONSHIP GETTERS
   // -------------------------------------------
   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   public getImpGeofootprintGeos() : ReadonlyArray<ImpGeofootprintGeo> {
      let _result: Array<ImpGeofootprintGeo> = new Array<ImpGeofootprintGeo>();
      (this.impGeofootprintMasters ?? []).forEach(impGeofootprintMaster => (impGeofootprintMaster.impGeofootprintLocations ?? [])
                                       .forEach(impGeofootprintLocation => (impGeofootprintLocation.impGeofootprintTradeAreas ?? [])
                                       .forEach(impGeofootprintTradeArea => (_result = _result.concat(impGeofootprintTradeArea.impGeofootprintGeos ?? [])))));
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   public getImpGeofootprintLocations() : ReadonlyArray<ImpGeofootprintLocation>;
   public getImpGeofootprintLocations(activeOnly: boolean) : ReadonlyArray<ImpGeofootprintLocation>;
   public getImpGeofootprintLocations(activeOnly: boolean, siteType: ImpClientLocationTypeCodes) : ReadonlyArray<ImpGeofootprintLocation>;
   public getImpGeofootprintLocations(activeOnly: boolean = false, siteType?: ImpClientLocationTypeCodes) : ReadonlyArray<ImpGeofootprintLocation> {
      let _result: Array<ImpGeofootprintLocation> = new Array<ImpGeofootprintLocation>();
      (this.impGeofootprintMasters ?? []).forEach(impGeofootprintMaster => _result = _result.concat(impGeofootprintMaster.impGeofootprintLocations.filter(l => {
        let filterResult = true;
        if (activeOnly) filterResult = l.isActive;
        if (siteType != null) filterResult = filterResult && ImpClientLocationTypeCodes.parse(l.clientLocationTypeCode) === siteType;
        return filterResult;
      }) ?? []));
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   public getImpGeofootprintLocAttribs() : ReadonlyArray<ImpGeofootprintLocAttrib> {
      let _result: Array<ImpGeofootprintLocAttrib> = new Array<ImpGeofootprintLocAttrib>();
      (this.impGeofootprintMasters ?? []).forEach(impGeofootprintMaster => (impGeofootprintMaster.impGeofootprintLocations ?? [])
                                       .forEach(impGeofootprintLocation => (_result = _result.concat(impGeofootprintLocation.impGeofootprintLocAttribs ?? []))));
      return _result;
   }

   /** @description Transient property that will not persist with the model. Updates are allowed, but not inserts & deletes */
   public getImpGeofootprintTradeAreas() : ReadonlyArray<ImpGeofootprintTradeArea> {
      let _result: Array<ImpGeofootprintTradeArea> = new Array<ImpGeofootprintTradeArea>();
      (this.impGeofootprintMasters ?? []).forEach(impGeofootprintMaster => (impGeofootprintMaster.impGeofootprintLocations ?? [])
                                       .forEach(impGeofootprintLocation => (_result = _result.concat(impGeofootprintLocation.impGeofootprintTradeAreas ?? []))));
      return _result;
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
      this.impGeofootprintMasters.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.impProjectPrefs.forEach(fe => fe.setTreeProperty(propName, propValue));
      this.impProjectVars.forEach(fe => fe.setTreeProperty(propName, propValue));
   }

   // Removes a tree property from this level down
   public removeTreeProperty(propName: string)
   {
      delete this[propName];
      // Ask the children to remove the tree property
      this.impGeofootprintMasters.forEach(fe => fe.removeTreeProperty(propName   ));
      this.impProjectPrefs.forEach(fe => fe.removeTreeProperty(propName   ));
      this.impProjectVars.forEach(fe => fe.removeTreeProperty(propName   ));
   }

   // Convert JSON objects into Models
   public convertToModel()
   {
      // Convert JSON objects into models
      this.impGeofootprintMasters = (this.impGeofootprintMasters ?? []).map(ma => new ImpGeofootprintMaster(ma));
      this.impProjectPrefs = (this.impProjectPrefs ?? []).map(ma => new ImpProjectPref(ma));
      this.impProjectVars = (this.impProjectVars ?? []).map(ma => new ImpProjectVar(ma));

      // Push this as transient parent to children
      this.impGeofootprintMasters.forEach(fe => fe.impProject = this);
      this.impProjectPrefs.forEach(fe => fe.impProject = this);
      this.impProjectVars.forEach(fe => fe.impProject = this);

      // Ask the children to convert into models
      this.impGeofootprintMasters.forEach(fe => fe.convertToModel());
      this.impProjectPrefs.forEach(fe => fe.convertToModel());
      this.impProjectVars.forEach(fe => fe.convertToModel());

      // Set the isComplete flag indicating the load is complete
      this.setTreeProperty('isComplete', true);
   }
}
