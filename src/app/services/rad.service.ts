import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { RadData } from '../models/RadData';
import { AppConfig } from '../app.config';
import { MetricService, MetricMessage } from '../val-modules/common/services/metric.service';
import { RestResponse } from '../models/RestResponse';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AuthService } from './auth.service';
import { UserService } from './user.service';
import { take } from 'rxjs/operators';
import { AppStateService } from './app-state.service';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpDiscoveryService } from './ImpDiscoveryUI.service';

@Injectable()
export class RadService {

  private radData: Array<RadData>;
  private radUrl: string = this.appConfig.valServiceBase + 'v1/targeting/base/impradlookup/search?q=impRadLookup';
  private filteredRadData: Array<RadData>;
  private predictedResp: number;

  constructor(private appStateService: AppStateService,
              private discoveryService: ImpDiscoveryService,
              private appConfig: AppConfig,
              private metricService: MetricService,
              private httpClient: HttpClient,
              private locationService: ImpGeofootprintLocationService,
              private geoService: ImpGeofootprintGeoService,
              private authService: AuthService,
              private userService: UserService) {

    //Subscribe to the impDiscoveryService
    this.appStateService.currentProject$.subscribe(project => this.filterRad(project), error => this.handleError(error));

    //Subscribe to the metrics service
    this.metricService.observeMetrics().subscribe(message => this.calculateMetrics(message));

    // load the RAD data after the user has been logged in
    this.userService.userObservable.pipe(take(1)).subscribe(res => this.fetchRadData(res));
  }

  /**
   * Filter the RAD data based on the data available in the ImpDiscoveryService
   */
  private filterRad(currentProject: ImpProject) {
    const categoryLookup = Array.from(this.discoveryService.radCategoryCodeByName.entries());
    const currentCategory = categoryLookup.filter(([key, value]) => value === currentProject.industryCategoryCode).map(([key]) => key);
    //filter down the RAD data based on the current product and category
    if (this.radData != null && currentCategory.length > 0) {
      this.filteredRadData = this.radData.filter(f =>
         f.category === currentCategory[0]
         && f.product === currentProject.radProduct);
    }
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

          this.predictedResp = predictedResponse;




          /**
           * US7497: Commenting out the ROI caluclation
           * Please leave this here in case we need it again
           */
          //Calculate Predicted ROI
          /*const discoveryData = this.impDiscoveryService.get();
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
          }*/
        } catch (error) {
          this.handleError(error);
        }
      } else {
        this.metricService.add('PERFORMANCE', 'Predicted Response', 'N/A');
        this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', 'N/A');
        //this.metricService.add('PERFORMANCE', 'Predicted ROI', 'N/A');
      }
    }

    if (metricMessage.group === 'CAMPAIGN' && metricMessage.key === 'Est. Total Investment'){

        //Calculate Cost per Response
          let cpr = 0;
         const campaignMap =  this.metricService.metrics.get('CAMPAIGN');
         const totalInvestment = Number(campaignMap.get('Est. Total Investment').replace(/[^\w.\s]/g, ''));
         if (!Number.isNaN(totalInvestment) && totalInvestment != 0 && this.predictedResp != 0){
            console.log('total investment:::', totalInvestment);
            if (this.predictedResp != 0 && totalInvestment != 0 && !Number.isNaN(this.predictedResp) && !Number.isNaN(totalInvestment)){
               // cpr = this.predictedResp / totalInvestment;
               cpr =  totalInvestment / this.predictedResp;
            }
         }
         if (Number.isNaN(cpr)){
          this.metricService.add('PERFORMANCE', 'Cost per Response', 'N/A');
        }else{
          this.metricService.add('PERFORMANCE', 'Cost per Response', '$' + cpr.toFixed(2));
        }
    }
  }

  /**
   * Fetch the RAD data from the Fuse service and store it locally in memory
   */
  public fetchRadData(user: any) {
    //const token: string = this.authService.getOauthToken();
    //const headers: HttpHeaders = new HttpHeaders().set('Authorization', 'Bearer ' + token);
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
