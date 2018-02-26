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
import { ImpDiscoveryUI } from '../models/ImpDiscoveryUI';

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
  private getDiscoveryData(): any {
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

    //If we have valid RAD data and a household count available then we can recalculate the performance metrics
    /*console.log('determing whether to recalculate metrics');
    if(this.filteredRadData != null && this.filteredRadData.length > 0) {
      if(this.metricService.metrics.has('CAMPAIGN')) {
        const perfMetrics = this.metricService.metrics.get('CAMPAIGN');
        if(perfMetrics.has('Household Count')) {
          const hhc = perfMetrics.get('Household Count');
          const metricMessage: MetricMessage = new MetricMessage(MetricOperations.ADD, 'CAMPAIGN', 'Household Count', hhc);
          console.log('recalculating metrics');
          this.calculateMetrics(metricMessage);
        }
      }
    }*/
  }

  /**
   * Calculate the performance metrics and send them to the metric service
   */
  private calculateMetrics(metricMessage: MetricMessage) {
    if (metricMessage.group === 'CAMPAIGN' && metricMessage.key === 'Household Count') {
      if (this.filteredRadData != null && this.filteredRadData.length > 0) {
        try {
          //Calculate the predicted response
          const hhCount: number = Number(metricMessage.value.replace(/,/g, ''));
          let predictedResponse: number = hhCount * (this.filteredRadData[0].responseRate / 100);
          predictedResponse = Math.round(predictedResponse);
          if (Number.isNaN(predictedResponse)) {
            this.metricService.add('PERFORMANCE', 'Predicted Response', 'N/A');
          } else {
            this.metricService.add('PERFORMANCE', 'Predicted Response', predictedResponse.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
          }

          //Calculate Predicted Topline Sales Generated
          let toplineSales = predictedResponse * this.filteredRadData[0].avgTicket;
          toplineSales = Math.round(toplineSales);
          if (Number.isNaN(toplineSales)) {
            this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', 'N/A');
          } else {
            this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', '$' + toplineSales.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
          }

          //Calculate Predicted ROI
          const discoveryData = this.impDiscoveryService.get();
          if (discoveryData[0].cpm != null) {
            let predictedROI = toplineSales - (discoveryData[0].cpm * hhCount / 1000);
            predictedROI = Math.round(predictedROI);
            if (Number.isNaN(predictedROI)) {
              this.metricService.add('PERFORMANCE', 'Predicted ROI', 'N/A');
            } else {
              this.metricService.add('PERFORMANCE', 'Predicted ROI', '$' + predictedROI.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ','));
            }
          } else {
            this.metricService.add('PERFORMANCE', 'Predicted ROI', 'N/A');
          }
        } catch (error) {
          this.handleError(error);
        }
      } else {
        this.metricService.add('PERFORMANCE', 'Predicted Response', 'N/A');
        this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', 'N/A');
        this.metricService.add('PERFORMANCE', 'Predicted ROI', 'N/A');
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
