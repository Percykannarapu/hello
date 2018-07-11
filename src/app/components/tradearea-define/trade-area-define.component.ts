import { SelectItem } from 'primeng/primeng';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppConfig } from '../../app.config';
import { TradeAreaUIModel } from './trade-area-ui.model';
import { AppTradeAreaService, TradeAreaMergeSpec } from '../../services/app-trade-area.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { map, take, tap, filter } from 'rxjs/operators';
import { UsageService } from '../../services/usage.service';
import { Subscription } from 'rxjs';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppStateService } from '../../services/app-state.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';

type SiteType = 'Site' | 'Competitor';
interface MergeType { value: TradeAreaMergeSpec; name:string;}

@Component({
    selector: 'val-trade-area-define',
    templateUrl: './trade-area-define.component.html',
    styleUrls: ['./trade-area-define.component.css']
})
export class TradeAreaDefineComponent implements OnInit, OnDestroy {

  private siteTradeAreas: TradeAreaUIModel[];
  private siteMergeType: MergeType;
  private competitorTradeAreas: TradeAreaUIModel[];
  private competitorMergeType: MergeType;

  private analysisLevelSub: Subscription;
  private siteCountSub: Subscription;
  private competitorCountSub: Subscription;
  private locationCountMap: Map<string, number> = new Map<string, number>();

  currentTradeAreas: TradeAreaUIModel[];
  currentMergeType: MergeType;
  currentSiteType: SiteType;
  tradeAreaMergeTypes: MergeType[];

  constructor(private tradeAreaService: AppTradeAreaService, private config: AppConfig,
              private impGeofootprintGeoService: ImpGeofootprintGeoService,
              private locationService: ImpGeofootprintLocationService, private messageService: AppMessagingService,
              private usageService: UsageService, private stateService: AppStateService) {
    this.tradeAreaMergeTypes = [
      { name: 'No Merge', value: 'No Merge' },
      { name: 'Merge Each', value: 'Merge Each' },
      { name: 'Merge All', value: 'Merge All' }
    ];
    this.siteTradeAreas = [
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius)
    ];
    this.competitorTradeAreas = [
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius)
    ];
    this.siteMergeType = this.tradeAreaMergeTypes[1];
    this.competitorMergeType = this.tradeAreaMergeTypes[1];
    this.currentSiteType = 'Site';
    this.currentTradeAreas = this.siteTradeAreas;
    this.currentMergeType = this.siteMergeType;
  }

  private static isValidIndex(index: any) : index is (0 | 1 | 2) {
    const currentIndex = Number(index);
    return !Number.isNaN(currentIndex) && currentIndex >= 0 && currentIndex < 3;
  }

  public ngOnInit() : void {
    this.siteCountSub = this.locationService.storeObservable.pipe(
      map(locations => locations.filter(loc => loc.clientLocationTypeCode === 'Site').length)
    ).subscribe(siteCount => this.locationCountMap.set('Site', siteCount));
    this.competitorCountSub = this.locationService.storeObservable.pipe(
      map(locations => locations.filter(loc => loc.clientLocationTypeCode === 'Competitor').length)
    ).subscribe(competitorCount => this.locationCountMap.set('Competitor', competitorCount));

    this.stateService.siteTradeAreas$.subscribe(tradeAreaData => this.onChangeTradeArea(tradeAreaData, this.siteTradeAreas));
    this.stateService.competitorTradeAreas$.subscribe(tradeAreaData => this.onChangeTradeArea(tradeAreaData, this.competitorTradeAreas));

    // Subscribe to merge type changes
    this.stateService.taSiteMergeType$.subscribe(taSiteMergeData => this.onChangeTaMergeType(taSiteMergeData));
    this.stateService.taCompetitorMergeType$.subscribe(taCompetitorMergeData => this.onChangeTaMergeType(taCompetitorMergeData));

    // subscribe to clear the field values
    this.stateService.getClearUserInterfaceObs().subscribe(bool => {
        if (bool)
            this.clearTradeArea();
        this.stateService.clearUserInterface.next(false);    
    });
   }

  public ngOnDestroy() : void {
    if (this.analysisLevelSub) this.analysisLevelSub.unsubscribe();
  }

  public onApplyBtnClick() {
    let isValid = true;
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    if (!this.locationCountMap.has(this.currentSiteType) || this.locationCountMap.get(this.currentSiteType) < 1) {
      this.messageService.showGrowlError('Trade Area Error', `You must add at least 1 ${this.currentSiteType} before applying a trade area to ${this.currentSiteType}s`);
      isValid = false;
    }
    if (isValid && (currentAnalysisLevel == null || currentAnalysisLevel === '') && this.currentSiteType === 'Site') {
      this.messageService.showGrowlError('Trade Area Error', `You must select an Analysis Level before applying a trade area to Sites`);
      isValid = false;
    }
    if (isValid) {
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'radius', action: 'applied' });
      let metricText = '';
      let counter = 1;
      for (const tradeArea of this.currentTradeAreas) {
        if (!tradeArea.tradeArea) {
          continue;
        }
        metricText += 'TA' + counter + ' ' + tradeArea.tradeArea.toString() + ' Miles ~';
        counter++;
      }
      this.usageService.createCounterMetric(usageMetricName, metricText, null);
      const tradeAreas = this.currentTradeAreas.map(ui => ({ radius: ui.tradeArea, selected: ui.isShowing }));
      this.tradeAreaService.applyRadiusTradeArea(tradeAreas, this.currentSiteType);
      this.tradeAreaService.updateMergeType(this.currentMergeType.value, this.currentSiteType);
    }

      this.stateService.uniqueIdentifiedGeocodes$.pipe(
        filter(geos => geos != null && geos.length > 0),
        take(1)
      ).subscribe (geos => {
       this.tradeAreaService.zoomToTradeArea();
    });
  }

  public onChangeSiteType(event: SiteType) : void {
    switch (event) {
      case 'Site':
        this.currentTradeAreas = this.siteTradeAreas;
        this.currentMergeType = this.siteMergeType;
        break;
      case 'Competitor':
        this.currentTradeAreas = this.competitorTradeAreas;
        this.currentMergeType = this.competitorMergeType;
    }
  }

  public onChangeTradeArea(tradeAreas: Map<number, ImpGeofootprintTradeArea[]>, uiModels: TradeAreaUIModel[]) {
    if (tradeAreas == null || tradeAreas.size === 0)
      return;
    console.log('trade-area-define.component.onChangeTradeArea - fired', [tradeAreas, uiModels]);
    for (let i = 0; i < uiModels.length; ++i) {
      const currentData = tradeAreas.get(i + 1);
      if (currentData != null && currentData.length > 0) {
        uiModels[i].applyDatastoreInstance(currentData[0]);
      }
    }
  }

  onChangeTradeAreaVisibility(index: any) : void {
    if (TradeAreaDefineComponent.isValidIndex(index)) {
      this.tradeAreaService.updateTradeAreaSelection(index, this.currentTradeAreas[index].isShowing, this.currentSiteType);
    }
  }

  onChangeMergeType() : void {
    this.tradeAreaService.updateMergeType(this.currentMergeType.value, this.currentSiteType);
//    console.log('TEST MERGE::::',this.currentMergeType);
  }

  isApplyButtonDisabled() : boolean {
    return this.currentTradeAreas.some(t => t.isValid === false) || this.currentTradeAreas.every(t => t.isValid == null);
  }

  getMergeType(mergeType: string) : MergeType {
      let result: MergeType = this.currentMergeType;
      switch(mergeType) {
         case 'No Merge':
            result = this.tradeAreaMergeTypes[0];
            break;

         case 'Merge Each':
            result = this.tradeAreaMergeTypes[1];
            break;

         case 'Merge All':
            result = this.tradeAreaMergeTypes[2];
            break;

         default:
            result = this.currentMergeType;
      }
      return result;
   }

   onChangeTaMergeType(mergeType: string)
   {
      // console.log("onChangeTaSiteMergeType - fired - mergeType: ", mergeType);
      if (this.currentSiteType === 'Site' || this.currentSiteType === 'Competitor')
      {
         this.currentMergeType = this.getMergeType(mergeType);
         this.tradeAreaService.updateMergeType(this.currentMergeType.value, this.currentSiteType);
      }
   }

   public clearTradeArea(){
    this.siteTradeAreas = [
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius)
    ];
    this.competitorTradeAreas = [
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius),
      new TradeAreaUIModel(this.config.maxBufferRadius)
    ];
    this.siteMergeType = this.tradeAreaMergeTypes[1];
    this.competitorMergeType = this.tradeAreaMergeTypes[1];
    this.currentSiteType = 'Site';
    this.currentTradeAreas = this.siteTradeAreas;
    this.currentMergeType = this.siteMergeType;
   }
}
