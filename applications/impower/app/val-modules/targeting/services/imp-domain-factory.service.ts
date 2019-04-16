import { Injectable } from '@angular/core';
import { AppConfig } from '../../../app.config';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintMaster } from '../models/ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';
import { ImpProject } from '../models/ImpProject';
import { FieldContentTypeCodes, TradeAreaTypeCodes } from '../targeting.enums';
import { DAOBaseStatus } from '../../api/models/BaseModel';
import { ValGeocodingResponse } from '../../../models/val-geocoding-response.model';
import { UserService } from '../../../services/user.service';
import { ImpProjectPref } from '../models/ImpProjectPref';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';
import { ImpProjectVar } from '../models/ImpProjectVar';
import { AudienceDataDefinition } from '../../../models/audience-data.model';

function isNumber(value: any) : value is number {
  return value != null && value !== '' && !Number.isNaN(Number(value));
}

@Injectable({
  providedIn: 'root'
})
export class ImpDomainFactoryService {

  // private static entityId = -1;
  // private static getNextId() : number {
  //   return this.entityId--;
  // }

  constructor(private config: AppConfig, private userService: UserService) {}

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

  createProject() : ImpProject {
    const result = new ImpProject({
      //projectId: ImpDomainFactoryService.getNextId(),
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      createDate: new Date(Date.now()),
      createUser: this.userService.getUser().userId,
      modifyDate: new Date(Date.now()),
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
    const master = new ImpGeofootprintMaster({
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      createdDate: new Date(Date.now()),
      methSeason: null,
      status: 'SUCCESS',
      summaryInd: 0,
      isMarketBased: false,
      isActive: true
    });
    master.impProject = result;
    result.impGeofootprintMasters.push(master);
    return result;
  }

  createProjectVar(parent: ImpProject, varPk: number, audience: AudienceDataDefinition, isActive: boolean = true, duplicatePksOverwrite: boolean = true) : ImpProjectVar {
    if (parent == null) throw new Error('Project Var factory requires a valid Project instance');
    if (audience == null) throw new Error('Project Var factory requires a valid audience instance');
    const existingVar = parent.impProjectVars.find(pv => pv.varPk === varPk);
    if (existingVar != null && !duplicatePksOverwrite) throw new Error('A duplicate Project Var addition was attempted');
    const source = audience.audienceSourceType + '_' + audience.audienceSourceName;
    const isCustom = audience.audienceSourceType === 'Custom';
    if (existingVar == null) {
      const projectVar = new ImpProjectVar();
      projectVar.baseStatus = DAOBaseStatus.INSERT;
      projectVar.dirty = true;
      projectVar.varPk = varPk;
      projectVar.isShadedOnMap = audience.showOnMap;
      projectVar.isIncludedInGeoGrid = audience.showOnGrid;
      projectVar.isIncludedInGeofootprint = audience.exportInGeoFootprint;
      projectVar.isNationalExtract = audience.exportNationally;
      projectVar.indexBase = audience.selectedDataSet;
      projectVar.fieldname = audience.audienceName;
      projectVar.fieldconte = audience.fieldconte;
      projectVar.source = source;
      projectVar.isCustom = isCustom;
      projectVar.isString = false;
      projectVar.isNumber = false;
      projectVar.isUploaded = isCustom;
      projectVar.isActive = true;
      projectVar.uploadFileName = isCustom ? audience.audienceSourceName : '';
      projectVar.sortOrder = audience.audienceCounter;
      projectVar.customVarExprDisplay = `${audience.audienceName} (${audience.audienceSourceName})`;
      projectVar.customVarExprQuery = (source.toUpperCase() === 'OFFLINE_TDA' ? "Offline":"Online") + `/${audience.audienceSourceName}/${varPk}`;
      projectVar.impProject = parent;
      parent.impProjectVars.push(projectVar);
      return projectVar;
    } else {
      existingVar.dirty = true;
      existingVar.isShadedOnMap = audience.showOnMap;
      existingVar.isIncludedInGeoGrid = audience.showOnGrid;
      existingVar.isIncludedInGeofootprint = audience.exportInGeoFootprint;
      existingVar.isNationalExtract = audience.exportNationally;
      existingVar.indexBase = audience.selectedDataSet;
      existingVar.fieldname = audience.audienceName;
      existingVar.fieldconte = audience.fieldconte;
      existingVar.source = source;
      existingVar.isCustom = isCustom;
      existingVar.isString = false;
      existingVar.isNumber = false;
      existingVar.isUploaded = isCustom;
      existingVar.isActive = true;
      existingVar.uploadFileName = isCustom ? audience.audienceSourceName : '';
      existingVar.sortOrder = audience.audienceCounter;
      existingVar.customVarExprDisplay = `${audience.audienceName} (${audience.audienceSourceName})`;
      existingVar.customVarExprQuery = (source.toUpperCase() === 'OFFLINE_TDA' ? "Offline":"Online") + `/${audience.audienceSourceName}/${varPk}`;
      existingVar.impProject = parent;
      if (existingVar.baseStatus === DAOBaseStatus.UNCHANGED) existingVar.baseStatus = DAOBaseStatus.UPDATE;
      return existingVar;
    }
  }

   createProjectPref(parent: ImpProject, group: string, pref: string, type: string, value: string, isActive: boolean = true, overwriteDuplicate: boolean = true) : ImpProjectPref {
      if (parent == null) throw new Error('Project Pref factory requires a valid Project instance');
      if (pref == null) throw new Error('Project Preferences cannot have a null pref (Key)');

      const existingPref = parent.impProjectPrefs.find(impPref => impPref.prefGroup === group && impPref.pref === pref);
      if (existingPref == null) {
         const result = new ImpProjectPref({
            dirty:         true,
            baseStatus:    DAOBaseStatus.INSERT,
            projectPrefId: null,
            projectId:     parent.projectId,
            prefGroup:     group,
            prefType:      type,
            pref:          pref,
            val:           (value.length <= 4000) ? value : null,
            largeVal:      (value.length > 4000) ? value : null,
            isActive:      isActive,
            impProject:    parent // Set transient property
      });
      parent.impProjectPrefs.push(result);
      return result;
    }
    else {
      if (overwriteDuplicate) {
         existingPref.dirty = true,
         existingPref.baseStatus  = (existingPref.baseStatus === DAOBaseStatus.UNCHANGED) ? DAOBaseStatus.UPDATE : existingPref.baseStatus;
         existingPref.projectId   = parent.projectId,
         existingPref.prefGroup   = group,
         existingPref.prefType    = type,
         existingPref.pref        = pref,
         existingPref.val         = (value.length <= 4000) ? value : null,
         existingPref.largeVal    = (value.length > 4000) ? value : null,
         existingPref.isActive    = isActive,
         existingPref.impProject  = parent // Set transient property
         return existingPref;
      }
      else {
        throw new Error('A duplicate Project Pref code addition was attempted');
      }
    }
  }

  createLocation(parent: ImpProject, res: ValGeocodingResponse, siteType: string, analysisLevel?: string) : ImpGeofootprintLocation {
    if (parent == null || parent.impGeofootprintMasters == null || parent.impGeofootprintMasters[0] == null) throw new Error('Location factory requires a valid ImpProject instance with a valid ImpGeofootprintMaster instance');
    const nonAttributeProps = new Set<string>(['Latitude', 'Longitude', 'Address', 'City', 'State', 'ZIP', 'Number',
      'Name', 'Market', 'Market Code', 'Group', 'Description', 'Original Address', 'Original City', 'Original State',
      'Original ZIP', 'Match Code', 'Match Quality', 'Geocode Status', 'RADIUS1', 'RADIUS2', 'RADIUS3', 'CarrierRoute']);
    const result = new ImpGeofootprintLocation({
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      clientIdentifierId: 123, // Mandatory field, stubbing
      //clientLocationId: 123, // Mandatory field, stubbing
      locationName: res.Name != null ? res.Name.trim() : '',
      marketName: res.Market != null ? res.Market.trim() : '',
      marketCode: res['Market Code'] != null ? res['Market Code'].trim() : '',
      description: res['Description'] != null ? res['Description'].trim() : '',
      groupName: res['Group'] != null ? res['Group'].trim() : '',
      locAddress: res.Address,
      locCity: res.City,
      locState: res.State,
      locZip: res.ZIP,
      xcoord: Number(res.Longitude),
      ycoord: Number(res.Latitude),
      origAddress1: res['Original Address'] != null ? ((!res['previousAddress1']) ? res['Original Address'].trim() : res['previousAddress1'].trim()) : '' ,
      origCity: res['Original City'] != null ? ((!res['previousCity']) ? res['Original City'].trim() : res['previousCity'].trim()) : '' ,
      origState: res['Original State'] != null ? ((!res['previousState']) ? res['Original State'].trim() : res['previousState'].trim()) : '' ,
      origPostalCode: res['Original ZIP'] != null ?  ((!res['previousZip']) ? res['Original ZIP'].trim() : res['previousZip'].trim()) : '' ,
      recordStatusCode: res['Geocode Status'],
      geocoderMatchCode: res['Match Code'],
      geocoderLocationCode: res['Match Quality'],
      clientIdentifierTypeCode: 'PROJECT_ID',
      radius1: res['RADIUS1'],
      radius2: res['RADIUS2'],
      radius3: res['RADIUS3'],
      carrierRoute: res['CarrierRoute'],

      isActive: true
    });
    if (result.recordStatusCode === 'SUCCESS' || result.recordStatusCode === 'PROVIDED') {
      result.clientLocationTypeCode = siteType;
      result.xcoord = Number(res.Longitude);
      result.ycoord = Number(res.Latitude);
    } else {
      result.clientLocationTypeCode = `Failed ${siteType}`;
    }
    if (analysisLevel != null) {
      for (const key of Object.keys(res)) {
        if (key.toLowerCase().startsWith('home')) {
          switch (analysisLevel) {
            case 'ZIP': {
              if (key.toLowerCase().match('zip') && key.toLowerCase().match('code')) {
                result.homeGeocode = res[key];
              }
              break;
            }
            case 'ATZ': {
              if (key.toLowerCase().match('atz') && !key.toLowerCase().match('digital')) {
                result.homeGeocode = res[key];
              }
              break;
            }
            case 'Digital ATZ': {
              if (key.toLowerCase().match('digital') && key.toLowerCase().match('atz')) {
                result.homeGeocode = res[key];
              }
              break;
            }
            case 'PCR': {
              if (key.toLowerCase().match('carrier') && key.toLowerCase().match('route')) {
                result.homeGeocode = res[key];
              }
              break;
            }
          }
        }
      }
    }
    if (res.Number != null ) {
      result.locationNumber = res.Number;
    }
    result.impProject = parent;
    result.impGeofootprintMaster = parent.impGeofootprintMasters[0];
    parent.impGeofootprintMasters[0].impGeofootprintLocations.push(result);
    delete res['previousAddress1'];
    delete res['previousCity'];
    delete res['previousState'];
    delete res['previousZip'];
    for (const [k, v] of Object.entries(res)) {
      if (k == null || k.length === 0 || v == null || typeof v === 'function' || nonAttributeProps.has(k)) continue;
      this.createLocationAttribute(result, k, v);
    }
    return result;
  }

  createLocationAttribute(parent: ImpGeofootprintLocation, code: string, value: string, isActive: boolean = true, duplicateCodesOverwrite: boolean = true) : ImpGeofootprintLocAttrib {
    if (parent == null) throw new Error('Location Attribute factory requires a valid ImpGeofootprintLocation instance');
    if (value == null) throw new Error('Location Attributes cannot have a null value');
    const existingAttribute = parent.impGeofootprintLocAttribs.find(la => la.attributeCode === code);
    if (existingAttribute == null) {
      const result = new ImpGeofootprintLocAttrib({
        dirty: true,
        baseStatus: DAOBaseStatus.INSERT,
        createDate: new Date(Date.now()),
        createUser: this.userService.getUser().userId,
        modifyDate: new Date(Date.now()),
        modifyUser: this.userService.getUser().userId,
        attributeCode: code,
        attributeValue: value,
        attributeType: 'PUMPKIN_SPICE_LATTE',
        impGeofootprintLocation: parent,
        isActive: isActive
      });
      parent.impGeofootprintLocAttribs.push(result);
      return result;
    } else {
      if (duplicateCodesOverwrite) {
        existingAttribute.dirty = true;
        existingAttribute.attributeValue = value;
        existingAttribute.isActive = isActive;
        existingAttribute.modifyDate = new Date(Date.now());
        existingAttribute.modifyUser = this.userService.getUser().userId;
        if (existingAttribute.baseStatus === DAOBaseStatus.UNCHANGED) existingAttribute.baseStatus = DAOBaseStatus.UPDATE;
        return null;
      } else {
        throw new Error('A duplicate Location Attribute code addition was attempted');
      }
    }
  }

  createTradeArea(parent: ImpGeofootprintLocation, tradeAreaType: TradeAreaTypeCodes, isActive: boolean = true, index: number = null, radius: number = 0, attachToHierarchy: boolean = true) : ImpGeofootprintTradeArea {
    if (parent == null) throw new Error('Trade Area factory requires a valid ImpGeofootprintLocation instance');
    // All trade areas in the project
    const allTradeAreas = new Set(parent.impProject.getImpGeofootprintTradeAreas().map(ta => ta.taNumber));

    // All trade areas in the location
    const existingTradeAreas = new Set(parent.impGeofootprintTradeAreas.map(ta => ta.taNumber));

    // Determine the ta number to use
    let taNumber: number = 4;
    if (tradeAreaType === TradeAreaTypeCodes.Radius)
       taNumber = index + 1;
    else
    {
       // Retrieve the TA Number from a trade area of the same type if it exists
       const existingTradeAreasOfType = parent.impProject.getImpGeofootprintTradeAreas().filter(ta => ta.taType === tradeAreaType.toUpperCase()).map(ta => ta.taNumber);
       if (existingTradeAreasOfType != null && existingTradeAreasOfType.length > 0)
          taNumber = existingTradeAreasOfType[0];
       else
          // Calculate the next contiguous number to use
          while (taNumber <= 3 || (allTradeAreas != null && allTradeAreas.size > 0 && allTradeAreas.has(taNumber))) taNumber++;
    }
    //console.debug("### createTradeArea.taNumber = ", taNumber, ", taType: ", tradeAreaType, ", radius: ", radius);
    const result = new ImpGeofootprintTradeArea({
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      taNumber: taNumber,
      taName: ImpDomainFactoryService.createTradeAreaName(parent.clientLocationTypeCode, tradeAreaType, index),
      taRadius: radius,
      taType: tradeAreaType.toUpperCase(),
      impProject: parent.impProject,
      impGeofootprintMaster: parent.impGeofootprintMaster,
      impGeofootprintLocation: parent,
      isActive: parent.isActive ? isActive : parent.isActive,
      gtaId: null
    });
    if (existingTradeAreas.has(taNumber)) {
      console.error('A duplicate trade area number addition was attempted: ', { newTradeArea: result });
      throw new Error('A duplicate trade area number addition was attempted');
    }
    if (attachToHierarchy) parent.impGeofootprintTradeAreas.push(result);
    return result;
  }

  createGeoVar(parent: ImpGeofootprintTradeArea, geocode: string, varPk: number, value: string | number, fullId: string,
               fieldDescription: string = '', fieldType?: FieldContentTypeCodes, fieldName: string = '',
               nationalAvg: string = '', isActive: boolean = true, overwriteDuplicates: boolean = true) : ImpGeofootprintVar {

    const result = new ImpGeofootprintVar({
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      geocode,
      varPk
      //customVarExprQuery: fullId,
      //isNumber: false,
      //isString: false,
      //isCustom:  (fullId.includes('Custom')),
      //fieldconte: fieldType,
      //customVarExprDisplay: fieldDescription,
      //fieldname: fieldName,
      //natlAvg: nationalAvg//,
      //isActive
    });
    result.value = value;
/*    if (isNumber(value)) {
      //result.isNumber = true;
      result.valueNumber = value;
    } else {
      //result.isString = true;
      result.valueString = value;
    }*/
    if (parent != null) {
      const existingVar = parent.impGeofootprintVars.find(v => v.geocode === geocode && v.varPk === varPk);
      if (existingVar == null) {
        result.impGeofootprintTradeArea = parent;
        result.impGeofootprintLocation = parent.impGeofootprintLocation; // DPG
        parent.impGeofootprintVars.push(result);
      } else {
        if (overwriteDuplicates) {
          existingVar.dirty = true;
          existingVar.baseStatus = DAOBaseStatus.UPDATE;
          //existingVar.customVarExprQuery = result.customVarExprQuery;
          //existingVar.isNumber = result.isNumber;
          existingVar.value = value;
          //existingVar.valueNumber = result.valueNumber;
          //existingVar.isString = result.isString;
          //existingVar.valueString = result.valueString;
          //existingVar.customVarExprDisplay = result.customVarExprDisplay;
          //existingVar.fieldconte = result.fieldconte;
          //existingVar.fieldname = result.fieldname;
          //existingVar.natlAvg = result.natlAvg;
          //existingVar.isActive = result.isActive;
          return existingVar;
        } else {
          console.error('A duplicate GeoVar addition was attempted: ', { existingVar, newVar: result });
          throw new Error('A duplicate GeoVar addition was attempted');
        }
      }
    }
    return result;
  }

  createGeo(parent: ImpGeofootprintTradeArea, geocode: string, x: number, y: number, distance: number, isActive: boolean = true) : ImpGeofootprintGeo {
    if (parent == null) throw new Error('Geo factory requires a valid ImpGeofootprintTradeArea instance');
    const existingGeocodes = new Set(parent.impGeofootprintGeos.map(geo => geo.geocode));
    const result = new ImpGeofootprintGeo({
      dirty: true,
      baseStatus: DAOBaseStatus.INSERT,
      geocode: geocode,
      xcoord: x,
      ycoord: y,
      distance: distance,
      impProject: parent.impProject,
      impGeofootprintMaster: parent.impGeofootprintMaster,
      impGeofootprintLocation: parent.impGeofootprintLocation,
      impGeofootprintTradeArea: parent,
      isActive: parent.isActive ? isActive : parent.isActive,
      ggId: null
    });
    if (existingGeocodes.has(geocode)) {
      console.error('A duplicate geocode addition was attempted: ', { newGeo: result });
      throw new Error('A duplicate geocode addition was attempted');
    }
    parent.impGeofootprintGeos.push(result);
    return result;
  }
}
