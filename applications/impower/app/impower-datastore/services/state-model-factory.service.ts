import { Injectable } from '@angular/core';
import { DAOBaseStatus, TradeAreaTypeCodes } from '../../../worker-shared/data-model/impower.data-model.enums';
import { ImpGeofootprintMasterState } from '../../../worker-shared/data-model/state/imp-geofootprint-master-state';
import { ImpProjectPrefState } from '../../../worker-shared/data-model/state/imp-project-pref-state';
import { ImpProjectState } from '../../../worker-shared/data-model/state/imp-project-state';
import { ImpProjectVarState } from '../../../worker-shared/data-model/state/imp-project-var-state';
import { AudienceDataDefinition } from '../../models/audience-data.model';
import { UserService } from '../../services/user.service';

@Injectable({
  providedIn: 'root'
})
export class StateModelFactoryService {
  private static entityId = -1;
  private static getNextId() : number {
    return this.entityId--;
  }

  // TODO: Figure out how to get rid of userService here
  constructor(private userService: UserService) {}

  private static createTradeAreaName(locationTypeCode: string, tradeAreaType: TradeAreaTypeCodes, index: number) : string {
    switch (tradeAreaType) {
      case TradeAreaTypeCodes.Audience:
      case TradeAreaTypeCodes.Custom:
        return tradeAreaType;
      case TradeAreaTypeCodes.Manual:
        return 'Manual Entry';
      case TradeAreaTypeCodes.HomeGeo:
        return `${locationTypeCode} ${tradeAreaType}`;
      case TradeAreaTypeCodes.Radius:
        return `${locationTypeCode} ${tradeAreaType} ${index + 1}`;
    }
  }

  createProject() : ImpProjectState {
    return new ImpProjectState({
      projectId: StateModelFactoryService.getNextId(),
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      createDate: Date.now(),
      createUser: this.userService.getUser().userId,
      modifyDate: Date.now(),
      modifyUser: this.userService.getUser().userId,
      isActive: true,
      isIncludeAnne: true,
      isIncludeSolo: true,
      isIncludeValassis: true,
      isExcludePob: false,
      methAnalysis: null,
      clientIdentifierTypeCode: 'CAR_LIST',
      consumerPurchFreqCode: 'REMINDER',
      goalCode: 'ACQUISITION',
      objectiveCode: 'INCREASE_PENETRATION',
      isValidated: true,
      isSingleDate: true,
      isMustCover: true,
      isRunAvail: true,
      isHardPdi: true,
      isIncludeNonWeekly: true,
      isCircBudget: false,
      isDollarBudget: false,
      projectName: null,
    });
  }

  createProjectVar(parentId: number, varPk: number, audience: AudienceDataDefinition, isActive: boolean = true) : ImpProjectVarState {
    if (audience == null) throw new Error('Project Var factory requires a valid audience instance');
    const source = audience.audienceSourceType !== 'Combined' ? audience.audienceSourceType + '_' + audience.audienceSourceName : 'Combined';
    const isCustom = audience.audienceSourceType === 'Custom';
    return new ImpProjectVarState({
      pvId: StateModelFactoryService.getNextId(),
      projectId: parentId,
      baseStatus: DAOBaseStatus.INSERT,
      dirty: true,
      varPk: varPk,
      isShadedOnMap: false,
      isIncludedInGeoGrid: audience.showOnGrid,
      isIncludedInGeofootprint: audience.exportInGeoFootprint,
      isNationalExtract: audience.exportNationally,
      indexBase: audience.selectedDataSet,
      fieldname: audience.audienceName,
      source: source,
      isCustom: isCustom,
      isString: false,
      isNumber: false,
      isUploaded: isCustom,
      isActive: isActive,
      uploadFileName: isCustom ? audience.audienceSourceName : '',
      sortOrder: audience.sortOrder
    });
  }

  createProjectPref(parentId: number, prefGroup: string, pref: string, prefType: string, val: string, largeVal: string, isActive: boolean = true) : ImpProjectPrefState {
    if (val == null) throw new Error('Project Preferences cannot have a null value');
    return new ImpProjectPrefState({
      projectPrefId: StateModelFactoryService.getNextId(),
      projectId:     parentId,
      dirty:         true,
      baseStatus:    DAOBaseStatus.INSERT,
      prefGroup:     prefGroup,
      prefType:      prefType,
      pref:          pref,
      val:           val,
      largeVal:      largeVal,
      isActive:      isActive
    });
  }

  createMaster(parentId: number) : ImpGeofootprintMasterState {
    return new ImpGeofootprintMasterState({
      cgmId: StateModelFactoryService.getNextId(),
      projectId: parentId,
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      createdDate: Date.now(),
      methSeason: null,
      status: 'SUCCESS',
      summaryInd: 0,
      isMarketBased: false,
      isActive: true
    });
  }

  // createLocation(parent: ImpGeofootprintMasterState, res: ValGeocodingResponse, siteType: string, analysisLevel?: string) : ImpGeofootprintLocationState {
  //   if (parent == null) throw new Error('Location factory requires a valid ImpGeofootprintMasterState instance');
  //   const nonAttributeProps = new Set<string>(['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number',
  //     'Name', 'Market', 'Market Code', 'Group', 'Description', 'Original Address', 'Original City', 'Original State',
  //     'Original ZIP', 'Match Code', 'Match Quality', 'Geocode Status', 'RADIUS1', 'RADIUS2', 'RADIUS3']);
  //   const result = new ImpGeofootprintLocationState({
  //     glId: StateModelFactoryService.getNextId(),
  //     cgmId: parent.cgmId,
  //     projectId: parent.projectId,
  //     dirty: true,
  //     baseStatus: DAOBaseStatus.INSERT,
  //     clientIdentifierId: 123, // Mandatory field, stubbing
  //     locationName: res.Name != null ? res.Name.trim() : '',
  //     marketName: res.Market != null ? res.Market.trim() : '',
  //     marketCode: res['Market Code'] != null ? res['Market Code'].trim() : '',
  //     description: res['Description'] != null ? res['Description'].trim() : '',
  //     groupName: res['Group'] != null ? res['Group'].trim() : '',
  //     locAddress: res.Address,
  //     locCity: res.City,
  //     locState: res.State,
  //     locZip: res.ZIP,
  //     xcoord: Number(res.Longitude),
  //     ycoord: Number(res.Latitude),
  //     origAddress1: res['Original Address'] != null ? ((!res['previousAddress1']) ? res['Original Address'].trim() : res['previousAddress1'].trim()) : '' ,
  //     origCity: res['Original City'] != null ? ((!res['previousCity']) ? res['Original City'].trim() : res['previousCity'].trim()) : '' ,
  //     origState: res['Original State'] != null ? ((!res['previousState']) ? res['Original State'].trim() : res['previousState'].trim()) : '' ,
  //     origPostalCode: res['Original ZIP'] != null ?  ((!res['previousZip']) ? res['Original ZIP'].trim() : res['previousZip'].trim()) : '' ,
  //     recordStatusCode: res['Geocode Status'],
  //     geocoderMatchCode: res['Match Code'],
  //     geocoderLocationCode: res['Match Quality'],
  //     clientIdentifierTypeCode: 'PROJECT_ID',
  //     radius1: res['RADIUS1'],
  //     radius2: res['RADIUS2'],
  //     radius3: res['RADIUS3'],
  //     isActive: true
  //   });
  //   if (result.recordStatusCode === 'SUCCESS' || result.recordStatusCode === 'PROVIDED') {
  //     result.clientLocationTypeCode = siteType;
  //     result.xcoord = Number(res.Longitude);
  //     result.ycoord = Number(res.Latitude);
  //   } else {
  //     result.clientLocationTypeCode = `Failed ${siteType}`;
  //   }
  //   if (analysisLevel != null) {
  //     const homeGeoKeys = Object.keys(res).reduce((r, k) => (k.toLowerCase().startsWith('home') ? [...r, k] : r), []);
  //     for (const key of homeGeoKeys) {
  //       if (key.match(analysisLevel.toLowerCase()) || (analysisLevel === 'PCR' && key.match('carrier route'))) {
  //         result.homeGeocode = res[key];
  //       }
  //     }
  //   }
  //   if (res.Number != null ) {
  //     result.locationNumber = res.Number;
  //   }
  //   delete res['previousAddress1'];
  //   delete res['previousCity'];
  //   delete res['previousState'];
  //   delete res['previousZip'];
  //   for (const [k, v] of Object.entries(res)) {
  //     if (k == null || k.length === 0 || v == null || typeof v === 'function' || nonAttributeProps.has(k)) continue;
  //     this.createLocationAttribute(result, k, v);
  //   }
  //   return result;
  // }
  //
  // createLocationAttribute(parent: ImpGeofootprintLocationState, code: string, value: string, isActive: boolean = true, duplicateCodesOverwrite: boolean = true) : ImpGeofootprintLocAttribState {
  //   if (parent == null) throw new Error('Location Attribute factory requires a valid ImpGeofootprintLocation instance');
  //   if (value == null) throw new Error('Location Attributes cannot have a null value');
  //   const existingAttribute = parent.impGeofootprintLocAttribs.find(la => la.attributeCode === code);
  //   if (existingAttribute == null) {
  //     const result = new ImpGeofootprintLocAttrib({
  //       dirty: true,
  //       baseStatus: DAOBaseStatus.INSERT,
  //       createDate: new Date(Date.now()),
  //       createUser: this.userService.getUser().userId,
  //       modifyDate: new Date(Date.now()),
  //       modifyUser: this.userService.getUser().userId,
  //       attributeCode: code,
  //       attributeValue: value,
  //       attributeType: 'PUMPKIN_SPICE_LATTE',
  //       impGeofootprintLocation: parent,
  //       isActive: isActive
  //     });
  //     parent.impGeofootprintLocAttribs.push(result);
  //     return result;
  //   } else {
  //     if (duplicateCodesOverwrite) {
  //       existingAttribute.dirty = true;
  //       existingAttribute.attributeValue = value;
  //       existingAttribute.isActive = isActive;
  //       existingAttribute.modifyDate = new Date(Date.now());
  //       existingAttribute.modifyUser = this.userService.getUser().userId;
  //       if (existingAttribute.baseStatus === DAOBaseStatus.UNCHANGED) existingAttribute.baseStatus = DAOBaseStatus.UPDATE;
  //       return existingAttribute;
  //     } else {
  //       throw new Error('A duplicate Location Attribute code addition was attempted');
  //     }
  //   }
  // }
}
