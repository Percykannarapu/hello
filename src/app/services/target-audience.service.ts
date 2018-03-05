
import { Injectable } from '@angular/core';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { MetricService, MetricOperations, MetricMessage } from '../val-modules/common/services/metric.service';
import { ImpGeofootprintGeoAttribService } from '../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintGeoAttrib } from '../val-modules/targeting/models/ImpGeofootprintGeoAttrib';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/delay';

@Injectable()
export class TargetAudienceService {

  constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService,
    private impGeofootprintGeoAttribService: ImpGeofootprintGeoAttribService,
    private metricService: MetricService) {

    //Subscribe to the ImpGeofootprintGeoAttribService
    this.impGeofootprintGeoAttribService.storeObservable
      .filter(attrs => attrs[0] != null)
      .delay(2000)
      .subscribe(attrs => this.calculateMetrics(attrs));
  }

  /**
  * Invoke the methods to calculate metrics and use the MetricService to set them in the color box on the dahsboard
  * @param geoAttributes An array of ImpGeofootprintGeoAttrib that contains the data to update the metrics with
  */
  private calculateMetrics(geoAttributes: ImpGeofootprintGeoAttrib[]) {
    const geos: ImpGeofootprintGeo[] = this.impGeofootprintGeoService.get();
    const hhIncome = this.calculateSingleMetric(geoAttributes, 'cl2i00', 0);
    const popFamilies = this.calculateSingleMetric(geoAttributes, 'cl0c00', 2);
    const popHispanic = this.calculateSingleMetric(geoAttributes, 'cl2prh', 2);
    const casualDining = this.calculateSingleMetric(geoAttributes, 'tap049', 0);

    if (Number.isNaN(hhIncome)) {
      this.metricService.add('AUDIENCE', 'Median Household Income', '0');
    } else {
      this.metricService.add('AUDIENCE', 'Median Household Income', '$' + hhIncome.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
    }
    if (Number.isNaN(popFamilies)) {
      this.metricService.add('AUDIENCE', '% \'17 HHs Families with Related Children < 18 Yrs', '0');
    } else {
      this.metricService.add('AUDIENCE', '% \'17 HHs Families with Related Children < 18 Yrs', popFamilies.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%');
    }
    if (Number.isNaN(popHispanic)) {
      this.metricService.add('AUDIENCE', '% \'17 Pop Hispanic or Latino', '0');
    } else {
      this.metricService.add('AUDIENCE', '% \'17 Pop Hispanic or Latino', popHispanic.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',') + '%');
    }
    if (Number.isNaN(casualDining)) {
      this.metricService.add('AUDIENCE', 'Casual Dining: 10+ Times Past 30 Days', '0');
    } else {
      this.metricService.add('AUDIENCE', 'Casual Dining: 10+ Times Past 30 Days', casualDining.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

    }
  }

  /**
  * Calculate a single target audience metric
  * @param geoAttributes An array of ImpGeofootprintGeoAttrib that contains the data to update the metrics with
  * @param geos The currently selected geographies
  * @param attributeCode The parameter that the metric will be calculated for
  */
  private calculateSingleMetric(geoAttributes: ImpGeofootprintGeoAttrib[], attributeCode: string, precision: number): number {
    if (geoAttributes.length < 1) {
      return 0;
    }
    const geos = this.impGeofootprintGeoService.get();
    let hhc: number = 0;
    let metricVal: number = 0;
    for (const geo of geos) {
      if (geo.hhc == null) {
        continue;
      }
      hhc += geo.hhc;
      for (const geoAttribute of geoAttributes) {
        if (geoAttribute.attributeCode === attributeCode && geoAttribute.impGeofootprintGeo.geocode === geo.geocode) {
          metricVal = (Number(geoAttribute.attributeValue) * geo.hhc) + metricVal;
        }
      }
    }
    //return Math.round(metricVal / hhc, precision);
    return Number((metricVal / hhc).toFixed(precision));
  }
}


