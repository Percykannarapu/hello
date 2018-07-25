import { Injectable } from '@angular/core';
import { ImpProject } from '../models/ImpProject';
import { ImpGeofootprintMaster } from '../models/ImpGeofootprintMaster';
import { ImpGeofootprintLocation } from '../models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../models/ImpGeofootprintTradeArea';

export enum TradeAreaTypes {
  Radius = 'Radius',
  Custom = 'Custom',
  HomeGeo = 'HomeGeo',
  Audience = 'Audience'
}

@Injectable({
  providedIn: 'root'
})
export class ImpDomainFactoryService {

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

  createTradeArea(parent: ImpGeofootprintLocation, index: number, tradeAreaType: TradeAreaTypes, isActive: boolean, radius: number = 0) : ImpGeofootprintTradeArea {
    if (parent == null) throw new Error('Trade Area factory requires a valid ImpGeofootprintLocation instance');
    const result = new ImpGeofootprintTradeArea({
      taNumber: index + 1,
      taName: `${parent.clientLocationTypeCode} ${tradeAreaType} ${index + 1}`,
      taRadius: radius,
      taType: tradeAreaType.toUpperCase(),
      impGeofootprintLocation: parent,
      isActive: isActive
    });
    parent.impGeofootprintTradeAreas.push(result);
    return result;
  }
}
