import { Injectable } from '@angular/core';
import { AppConfig } from '../../../app.config';
import { ImpGeofootprintGeo } from '../models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintLocAttrib } from '../models/ImpGeofootprintLocAttrib';
import { ImpGeofootprintMaster } from '../models/ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';
import { ImpProject } from '../models/ImpProject';
import { TradeAreaTypeCodes } from '../targeting.enums';

@Injectable({
  providedIn: 'root'
})
export class ImpDomainFactoryService {

  constructor(private config: AppConfig) {}

  private static createTradeAreaName(parent: ImpGeofootprintLocation, tradeAreaType: TradeAreaTypeCodes, index: number) : string {
    switch (tradeAreaType) {
      case TradeAreaTypeCodes.Audience:
      case TradeAreaTypeCodes.Custom:
        return tradeAreaType;
      case TradeAreaTypeCodes.Manual:
        return 'Manual Entry';
      case TradeAreaTypeCodes.HomeGeo:
        return `${parent.clientLocationTypeCode} ${tradeAreaType}`;
      case TradeAreaTypeCodes.Radius:
        return `${parent.clientLocationTypeCode} ${tradeAreaType} ${index + 1}`;
    }
  }

  createProject() : ImpProject {
    const result = new ImpProject();
    const master = new ImpGeofootprintMaster();
    master.impProject = result;
    result.impGeofootprintMasters.push(master);
    return result;
  }

  createLocation(parent: ImpGeofootprintMaster) : ImpGeofootprintLocation {
    if (parent == null) throw new Error('Location factory requires a valid ImpGeofootprintMaster instance');
    const result = new ImpGeofootprintLocation();
    result.impGeofootprintMaster = parent;
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

  createTradeArea(parent: ImpGeofootprintLocation, tradeAreaType: TradeAreaTypeCodes, isActive: boolean = true, index: number = null, radius: number = 0) : ImpGeofootprintTradeArea {
    if (parent == null) throw new Error('Trade Area factory requires a valid ImpGeofootprintLocation instance');
    const taNumber = tradeAreaType === TradeAreaTypeCodes.Radius ? index + 1 : parent.impGeofootprintTradeAreas.length + this.config.maxRadiusTradeAreas + 1;
    const result = new ImpGeofootprintTradeArea({
      taNumber: taNumber,
      taName: ImpDomainFactoryService.createTradeAreaName(parent, tradeAreaType, index),
      taRadius: radius,
      taType: tradeAreaType.toUpperCase(),
      impGeofootprintLocation: parent,
      isActive: parent.isActive ? isActive : parent.isActive
    });
    parent.impGeofootprintTradeAreas.push(result);
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
