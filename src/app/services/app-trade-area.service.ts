import { Injectable } from '@angular/core';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';

@Injectable()
export class ValTradeAreaService {

  constructor(private tradeAreaService: ImpGeofootprintTradeAreaService,
              private locationService: ImpGeofootprintLocationService) { }

  private static createTradeArea(radius: number, index: number, location: ImpGeofootprintLocation) : ImpGeofootprintTradeArea {
    return new ImpGeofootprintTradeArea({
      gtaId: index + 1,
      taNumber: index + 1,
      taName: `Site Radius ${index + 1}`,
      taRadius: radius,
      taType: 'RADIUS',
      impGeofootprintLocation: location
    });
  }

  public applyRadialTradeAreas(radiusInMiles: number[]) : void {
    const validRadii = radiusInMiles.filter(r => r != null);
    const allMatchingRadialTradeAreas = this.tradeAreaService.get().filter(ta => ta.taType === 'RADIUS');
    const locationsWithRadius: Set<ImpGeofootprintLocation> = new Set(this.tradeAreaService.get().map(ta => ta.impGeofootprintLocation));
    const locationsWithNoRadius = new Set(this.locationService.get().filter(a => !locationsWithRadius.has(a)));
    const locationTradeAreaMap: Map<ImpGeofootprintLocation, ImpGeofootprintTradeArea[]> = new Map<ImpGeofootprintLocation, ImpGeofootprintTradeArea[]>();
    allMatchingRadialTradeAreas.forEach(ta => {
      if (!locationTradeAreaMap.has(ta.impGeofootprintLocation)) {
        locationTradeAreaMap.set(ta.impGeofootprintLocation, [ta]);
      } else {
        locationTradeAreaMap.get(ta.impGeofootprintLocation).push(ta);
      }
    });
    locationsWithNoRadius.forEach(l => locationTradeAreaMap.set(l, []));

    const tradeAreasForInsert: ImpGeofootprintTradeArea[] = [];
    const tradeAreasForDelete: ImpGeofootprintTradeArea[] = [];

    for (const [key, values] of Array.from(locationTradeAreaMap.entries())) {
      for (const currentTA of values) {
        if (!validRadii.includes(currentTA.taRadius)) {
          tradeAreasForDelete.push(currentTA);
        }
      }
      validRadii.forEach((r, i) => {
        if (values.length === 0 || !values.map(v => v.taRadius).includes(r)) {
          tradeAreasForInsert.push(ValTradeAreaService.createTradeArea(r, i, key));
        }
      });
    }

    this.tradeAreaService.add(tradeAreasForInsert);
    console.log('Trade areas to delete: ', tradeAreasForDelete);
    //this.tradeAreaService.remove(tradeAreasForDelete);
  }
}
