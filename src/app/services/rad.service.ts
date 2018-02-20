import { Injectable, OnInit } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { RadData, RADCategory, RadProducts } from '../models/RadData';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';
import { AppConfig } from '../app.config';
import { MetricService, MetricOperations, MetricMessage } from '../val-modules/common/services/metric.service';
import { RestResponse } from '../models/RestResponse';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { BehaviorSubject } from 'rxjs/BehaviorSubject';
import { ImpDiscoveryUI } from '../Models/ImpDiscoveryUI';

@Injectable()
export class RadService {

  private radData: Array<RadData>;
  private radUrl: string = this.appConfig.valServiceBase + 'v1/targeting/base/impradlookup/search?q=impRadLookup';
  private category: string;
  private product: string;
  private filteredRadData: Array<RadData>;

  constructor(private impDiscoveryService: ImpDiscoveryService,
    private appConfig: AppConfig,
    private metricService: MetricService,
    private httpClient: HttpClient,
    private locationService: ImpGeofootprintLocationService,
    private geoService: ImpGeofootprintGeoService) {

    //Subscribe to the impDiscoveryService
    this.impDiscoveryService.storeObservable.subscribe(discoveryData => this.filterRad(), error => this.handleError(error));

    //Subscribe to the metrics service
    this.metricService.observeMetrics().subscribe(message => this.calculateMetrics(message));
  }

  /**
   * get the discovery data from the ImpDiscoveryService
   */
  private getDiscoveryData() : any {
    const discoveryData: Array<ImpDiscoveryUI> = this.impDiscoveryService.get();
    return { product: discoveryData[0].productCode, category: discoveryData[0].industryCategoryCode };
  }

  /**
   * Filter the RAD data based on the data available in the ImpDiscoveryService
   */
  private filterRad() {

    //get the current discovery data
    const discoveryData = this.getDiscoveryData();

    //filter down the RAD data based on the current product and category
    if (this.radData != null) {
      this.filteredRadData = this.radData.filter(f => f.category === discoveryData.category.name && f.product === discoveryData.product.productCode);
    }
  }

  /**
   * Calculate the predicted response and send it to the metric service
   */
  private calculateMetrics(metricMessage: MetricMessage) {
    if (metricMessage.group === 'CAMPAIGN' && metricMessage.key === 'Household Count') {
      try {
        //Calculate the predicted response
        const hhCount: number = Number(metricMessage.value.replace(',', ''));
        let predictedResponse: number = hhCount * (this.filteredRadData[0].responseRate / 100);
        predictedResponse = Math.round(predictedResponse);
        this.metricService.add('PERFORMANCE', 'Predicted Response', predictedResponse.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

        //Calculate Predicted Topline Sales Generated
        let toplineSales = predictedResponse * this.filteredRadData[0].avgTicket;
        toplineSales = Math.round(toplineSales);
        this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', '$' + toplineSales.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));

        //Calculate Predicted ROI
        const discoveryData = this.impDiscoveryService.get();
        let predictedROI = toplineSales - discoveryData[0].totalBudget;
        predictedROI = Math.round(predictedROI);
        this.metricService.add('PERFORMANCE', 'Predicted ROI', '$' + predictedROI.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
      } catch (error) {
        this.handleError(error);
      }
    }
  }

  /**
   * Fetch the RAD data from the Fuse service and store it locally in memory
   */
  public fetchRadData() {
    this.httpClient.get<RestResponse>(this.radUrl).subscribe(resp => this.parseResponse(resp), error => this.handleError(error));

  }

  private parseResponse(resp: RestResponse) {
    this.radData = new Array<RadData>();
    for (const row of resp.payload.rows) {
      const radData: RadData = new RadData();
      radData.radId = row.radId;
      radData.category = row.category;
      radData.product = row.product;
      radData.source = row.source;
      radData.responseRate = row.responseRate;
      radData.noOfCoupon = row.noOfCoupon;
      radData.avgTicket = row.avgTicket;
      radData.estCpm = row.estCpm;
      radData.grossMargin = row.grossMargin;
      this.radData.push(radData);
    }
  }

  private handleError(error: Error) {
    console.error(error);
  }

}
