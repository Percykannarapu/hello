import { ImpGeofootprintTradeAreaService } from './../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { SelectItem } from 'primeng/primeng';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppConfig } from '../../app.config';
import { TradeAreaUIModel } from './trade-area-ui.model';
import { RadialTradeAreaDefaults, ValTradeAreaService } from '../../services/app-trade-area.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { map } from 'rxjs/operators';
import { UsageService } from '../../services/usage.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { Subscription } from 'rxjs/Subscription';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';

type SiteType = 'Site' | 'Competitor';
interface MergeType { value: string; }

@Component({
    selector: 'val-trade-area-define',
    templateUrl: './trade-area-define.component.html',
    styleUrls: ['./trade-area-define.component.css']
})
export class TradeAreaDefineComponent implements OnInit, OnDestroy {

  private readonly siteTradeAreas: TradeAreaUIModel[];
  private readonly siteMergeType: MergeType;
  private readonly competitorTradeAreas: TradeAreaUIModel[];
  private readonly competitorMergeType: MergeType;

  private analysisLevelSub: Subscription;
  private siteCountSub: Subscription;
  private competitorCountSub: Subscription;
  private currentAnalysisLevel: string;
  private locationCountMap: Map<string, number> = new Map<string, number>();

  currentTradeAreas: TradeAreaUIModel[];
  currentMergeType: MergeType;
  currentSiteType: SiteType;
  tradeAreaMergeTypes: SelectItem[];

  constructor(private tradeAreaService: ValTradeAreaService, private config: AppConfig,
              private locationService: ImpGeofootprintLocationService, private messageService: AppMessagingService,
              private discoveryService: ImpDiscoveryService, private usageService: UsageService,
              private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
              private impGeofootprintGeoService: ImpGeofootprintGeoService, private attributeService: ImpGeofootprintGeoAttribService) {
    this.tradeAreaMergeTypes = [
      { label: 'No Merge', value: 'No Merge' },
      { label: 'Merge Each', value: 'Merge Each' },
      { label: 'Merge All', value: 'Merge All' }
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
    this.siteMergeType = { value: this.tradeAreaMergeTypes[1].value };
    this.competitorMergeType = { value: this.tradeAreaMergeTypes[1].value };
    this.currentSiteType = 'Site';
    this.currentTradeAreas = this.siteTradeAreas;
    this.currentMergeType = this.siteMergeType;
  }

  public ngOnInit() : void {
    this.siteCountSub = this.locationService.storeObservable.pipe(
      map(locations => locations.filter(loc => loc.clientLocationTypeCode === 'Site').length)
    ).subscribe(siteCount => this.locationCountMap.set('Site', siteCount));
    this.competitorCountSub = this.locationService.storeObservable.pipe(
      map(locations => locations.filter(loc => loc.clientLocationTypeCode === 'Competitor').length)
    ).subscribe(competitorCount => this.locationCountMap.set('Competitor', competitorCount));
    this.analysisLevelSub = this.discoveryService.storeObservable.pipe(
      map(disco => disco && disco.length > 0 ? disco[0].analysisLevel : null)
    ).subscribe(al => this.currentAnalysisLevel = al);

    this.impGeofootprintTradeAreaService.storeObservable.subscribe(tradeAreaData => this.onChangeTradeArea(tradeAreaData));
   }

  public ngOnDestroy() : void {
    if (this.analysisLevelSub) this.analysisLevelSub.unsubscribe();
  }

  public onApplyBtnClick() {
    let isValid = true;
    if (!this.locationCountMap.has(this.currentSiteType) || this.locationCountMap.get(this.currentSiteType) < 1) {
      this.messageService.showGrowlError('Trade Area Error', `You must add at least 1 ${this.currentSiteType} before applying a trade area to ${this.currentSiteType}s`);
      isValid = false;
    }
    if (isValid && (this.currentAnalysisLevel == null || this.currentAnalysisLevel === '') && this.currentSiteType === 'Site') {
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
      this.usageService.createCounterMetric(usageMetricName, metricText, 1);
      this.impGeofootprintGeoService.clearAll();
      this.attributeService.clearAll();
      const tradeAreas: TradeAreaUIModel[] = this.currentTradeAreas.filter(ta => ta.isShowing) || [];
      const settings = new RadialTradeAreaDefaults(tradeAreas.map(ta => ta.tradeArea), this.currentMergeType.value);
      this.tradeAreaService.applyRadialDefaults(settings, this.currentSiteType);
    }
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

   public onChangeTradeArea(impGeofootprintTradeAreas: ImpGeofootprintTradeArea[])
   {
      if (impGeofootprintTradeAreas == null || impGeofootprintTradeAreas.length <= 0)
         return;
      console.log('trade-area-define.component.onChangeTradeArea - fired', impGeofootprintTradeAreas);
      const ta1: ImpGeofootprintTradeArea[] = impGeofootprintTradeAreas.filter(ta => ta.taNumber === 1 && ta.taType === 'RADIUS');
      const ta2: ImpGeofootprintTradeArea[] = impGeofootprintTradeAreas.filter(ta => ta.taNumber === 2 && ta.taType === 'RADIUS');
      const ta3: ImpGeofootprintTradeArea[] = impGeofootprintTradeAreas.filter(ta => ta.taNumber === 3 && ta.taType === 'RADIUS');

      const radius1: number = (ta1 != null && ta1.length > 0) ? ta1[0].taRadius : null;
      const radius2: number = (ta2 != null && ta2.length > 0) ? ta2[0].taRadius : null;
      const radius3: number = (ta3 != null && ta3.length > 0) ? ta3[0].taRadius : null;

      this.siteTradeAreas[0].tradeArea = radius1;
      this.siteTradeAreas[0].isShowing = (ta1 != null && ta1.length > 0) ? ((ta1[0].isActive === 1) ? true : false) : null;
      this.siteTradeAreas[0].isValid   = true;

      this.siteTradeAreas[1].tradeArea = radius2;
      this.siteTradeAreas[1].isShowing = (ta2 != null && ta2.length > 0) ? ((ta2[0].isActive === 1) ? true : false) : null;
      this.siteTradeAreas[1].isValid   = true;

      this.siteTradeAreas[2].tradeArea = radius3;
      this.siteTradeAreas[2].isShowing = (ta3 != null && ta3.length > 0) ? ((ta3[0].isActive === 1) ? true : false) : null;
      this.siteTradeAreas[2].isValid   = true;

      // TODO: Should redraw trade areas
      // this.impGeofootprintGeoService.clearAll();
      // this.attributeService.clearAll();
      // const tradeAreas: TradeAreaUIModel[] = this.siteTradeAreas.filter(ta => ta.isShowing) || [];
      // const settings = new RadialTradeAreaDefaults(tradeAreas.map(ta => ta.tradeArea), this.currentMergeType.value);
      // this.tradeAreaService.applyRadialDefaults(settings, this.currentSiteType);      
   }

  applyDisabled() : boolean {
    return this.currentTradeAreas.some(t => t.isValid === false) || this.currentTradeAreas.every(t => t.isValid == null);
  }
}
