import { SelectItem } from 'primeng/primeng';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { AppConfig } from '../../app.config';
import { TradeAreaUIModel } from './trade-area-ui.model';
import { RadialTradeAreaDefaults, ValTradeAreaService } from '../../services/app-trade-area.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Subscription } from 'rxjs/Subscription';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { map } from 'rxjs/operators';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';

type SiteType = 'Site' | 'Competitor';
interface MergeType { value: string; }

@Component({
    selector: 'val-tradearea-define',
    templateUrl: './tradearea-define.component.html',
    styleUrls: ['./tradearea-define.component.css']
})
export class TradeareaDefineComponent implements OnInit, OnDestroy {

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
              private discoveryService: ImpDiscoveryService, private usageService: UsageService) {
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
      const tradeAreas: TradeAreaUIModel[] = this.currentTradeAreas.filter(ta => ta.isShowing) || [];
      const settings = new RadialTradeAreaDefaults(tradeAreas.map(ta => ta.tradeArea), this.currentMergeType.value);
      this.tradeAreaService.applyRadialDefaults(settings, this.currentSiteType);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'radius', action: 'applied' });
      const TA1 = tradeAreas[0] != null ? 'TA1 ' + tradeAreas[0].tradeArea + ' Miles ~' : '';
      const TA2 = tradeAreas[1] != null ? 'TA2 ' + tradeAreas[1].tradeArea + ' Miles ~' : '';
      const TA3 = tradeAreas[2] != null ? 'TA3 ' + tradeAreas[2].tradeArea + ' Miles' : '';
      this.usageService.createCounterMetric(usageMetricName, TA1 + TA2 + TA3, null);

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

  applyDisabled() : boolean {
    return this.currentTradeAreas.some(t => t.isValid === false) || this.currentTradeAreas.every(t => t.isValid == null);
  }
}
