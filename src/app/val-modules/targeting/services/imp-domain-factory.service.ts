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
import { ImpGeofootprintGeoAttrib } from '../models/ImpGeofootprintGeoAttrib';
import { ImpGeofootprintVar } from '../models/ImpGeofootprintVar';
import { ImpProjectVar } from '../models/ImpProjectVar';
import { AudienceDataDefinition } from '../../../models/audience-data.model';

function isNumber(value: any) : value is number {
  return value != null && value != '' && !Number.isNaN(Number(value));
}

@Injectable({
  providedIn: 'root'
})
export class ImpDomainFactoryService {

  constructor(private config: AppConfig) {}

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
      projectId: null
    });
    const master = new ImpGeofootprintMaster({
      methSeason: null
    });
    master.impProject = result;
    result.impGeofootprintMasters.push(master);
    return result;
  }

  createLocation(parent: ImpGeofootprintMaster, locationInfo: Partial<ImpGeofootprintLocation>) : ImpGeofootprintLocation {
    if (parent == null) throw new Error('Location factory requires a valid ImpGeofootprintMaster instance');
    const result = new ImpGeofootprintLocation(locationInfo);
    result.impGeofootprintMaster = parent;
    parent.impGeofootprintLocations.push(result);
    return result;
  }

  createLocationAttribute(parent: ImpGeofootprintLocation, code: string, value: string, isActive: boolean = true) : ImpGeofootprintLocAttrib {
    if (parent == null) throw new Error('Location Attribute factory requires a valid ImpGeofootprintLocation instance');
    const result = new ImpGeofootprintLocAttrib({
      attributeCode: code,
      attributeValue: value,
      impGeofootprintLocation: parent,
      isActive: isActive
    });
    parent.impGeofootprintLocAttribs.push(result);
    return result;
  }

  createTradeArea(parent: ImpGeofootprintLocation, tradeAreaType: TradeAreaTypeCodes, isActive: boolean = true, index: number = null, radius: number = 0, attachToHierarchy: boolean = true) : ImpGeofootprintTradeArea {
    if (parent == null) throw new Error('Trade Area factory requires a valid ImpGeofootprintLocation instance');
    const existingTradeAreas = new Set(parent.impGeofootprintTradeAreas.map(ta => ta.taNumber));
    const taNumber = tradeAreaType === TradeAreaTypeCodes.Radius ? index + 1 : parent.impGeofootprintTradeAreas.length + this.config.maxRadiusTradeAreas + 1;
    const result = new ImpGeofootprintTradeArea({
      taNumber: taNumber,
      taName: ImpDomainFactoryService.createTradeAreaName(parent.clientLocationTypeCode, tradeAreaType, index),
      taRadius: radius,
      taType: tradeAreaType.toUpperCase(),
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
      varPk,
      customVarExprQuery: fullId,
      isNumber: false,
      isString: false,
      isCustom: false,
      fieldconte: fieldType,
      customVarExprDisplay: fieldDescription,
      fieldname: fieldName,
      natlAvg: nationalAvg,
      isActive
    });
    if (isNumber(value)) {
      result.isNumber = true;
      result.valueNumber = value;
    } else {
      result.isString = true;
      result.valueString = value;
    }
    if (parent != null) {
      const existingVar = parent.impGeofootprintVars.find(v => v.geocode === geocode && v.varPk === varPk);
      if (existingVar == null) {
        result.impGeofootprintTradeArea = parent;
        parent.impGeofootprintVars.push(result);
      } else {
        if (overwriteDuplicates) {
          existingVar.dirty = true;
          existingVar.baseStatus = DAOBaseStatus.UPDATE;
          existingVar.customVarExprQuery = result.customVarExprQuery;
          existingVar.isNumber = result.isNumber;
          existingVar.valueNumber = result.valueNumber;
          existingVar.isString = result.isString;
          existingVar.valueString = result.valueString;
          existingVar.customVarExprDisplay = result.customVarExprDisplay;
          existingVar.fieldconte = result.fieldconte;
          existingVar.fieldname = result.fieldname;
          existingVar.natlAvg = result.natlAvg;
          existingVar.isActive = result.isActive;
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
    const result = new ImpGeofootprintGeo({
      geocode: geocode,
      xcoord: x,
      ycoord: y,
      distance: distance,
      impGeofootprintLocation: parent.impGeofootprintLocation,
      impGeofootprintTradeArea: parent,
      isActive: parent.isActive ? isActive : parent.isActive
    });
    parent.impGeofootprintGeos.push(result);
    return result;
  }
}
