import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { filter, map, take, tap } from 'rxjs/operators';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { AppTradeAreaService, TradeAreaMergeSpec } from '../../services/app-trade-area.service';
import { UsageService } from '../../services/usage.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Observable } from 'rxjs/Observable';
import { DistanceTradeAreaUiModel, TradeAreaModel } from './distance-trade-area/distance-trade-area-ui.model';

const tradeAreaExtract = (maxTas: number) => map<Map<number, ImpGeofootprintTradeArea[]>, ImpGeofootprintTradeArea[]>(taMap => {
  const result = [];
  for (let i = 0; i < maxTas; ++i) {
    result.push(taMap.has(i + 1) ? taMap.get(i + 1)[0] : null);
  }
  return result;
});

const mapToUiTradeAreas = (defVal: TradeAreaModel) =>
  map<ImpGeofootprintTradeArea[], TradeAreaModel[]>(taArray => taArray.map(ta => ta ? { radius: ta.taRadius, isShowing: ta.isActive, isApplied: true } : { ...defVal }));

const numberOrNull = (value: any) => value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value);

@Component({
  selector: 'val-trade-area-tab',
  templateUrl: './trade-area-tab.component.html'
})
export class TradeAreaTabComponent implements OnInit {

  private readonly defaultTradeArea: TradeAreaModel = { radius: null, isShowing: false, isApplied: false };

  maxTradeAreaCount: number = 3;
  siteTradeAreas$: Observable<TradeAreaModel[]>;
  competitorTradeAreas$: Observable<TradeAreaModel[]>;
  siteMergeType$: Observable<TradeAreaMergeSpec>;
  competitorMergeType$: Observable<TradeAreaMergeSpec>;

  private siteCounts = new Map<'Site' | 'Competitor', number>();
  private tradeAreaUiCache = new Map<'Site' | 'Competitor', TradeAreaModel[]>();

  constructor(private stateService: AppStateService,
               private messagingService: AppMessagingService,
               private tradeAreaService: AppTradeAreaService,
               private usageService: UsageService,
               private impLocationService: ImpGeofootprintLocationService) { }

  ngOnInit() {
    // keep track of locations - need this for validation upon submit of radius trade areas
    this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null),
      map(locations => locations.filter(loc => loc.clientLocationTypeCode === 'Site').length)
    ).subscribe(count => this.siteCounts.set('Site', count));
    this.impLocationService.storeObservable.pipe(
      filter(locations => locations != null),
      map(locations => locations.filter(loc => loc.clientLocationTypeCode === 'Competitor').length)
    ).subscribe(count => this.siteCounts.set('Competitor', count));

    // keep track of the merge flags
    this.siteMergeType$ = this.tradeAreaService.siteTradeAreaMerge$;
    this.competitorMergeType$ = this.tradeAreaService.competitorTradeAreaMerge$;

    // keep track of trade areas
    this.siteTradeAreas$ = this.stateService.siteTradeAreas$.pipe(
      tradeAreaExtract(this.maxTradeAreaCount),
      mapToUiTradeAreas(this.defaultTradeArea),
      tap(models => this.tradeAreaUiCache.set('Site', models))
    );
    this.competitorTradeAreas$ = this.stateService.competitorTradeAreas$.pipe(
      tradeAreaExtract(this.maxTradeAreaCount),
      mapToUiTradeAreas(this.defaultTradeArea),
      tap(models => this.tradeAreaUiCache.set('Competitor', models))
    );
  }

  onDistanceTradeAreasChanged(newModel: DistanceTradeAreaUiModel, siteType: 'Site' | 'Competitor') {
    // sort the values numerically, putting nulls at the end
    newModel.tradeAreas.sort((a, b) => (a.radius ? Number(a.radius) : Number.MAX_SAFE_INTEGER) - (b.radius ? Number(b.radius) : Number.MAX_SAFE_INTEGER));
    const cachedValue = this.tradeAreaUiCache.get(siteType);

    if (JSON.stringify(newModel.tradeAreas) === JSON.stringify(cachedValue)) return;

    let isValid = true;
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    if (!this.siteCounts.has(siteType) || this.siteCounts.get(siteType) < 1) {
      this.messagingService.showGrowlError('Trade Area Error', `You must add at least 1 ${siteType} before applying a trade area to ${siteType}s`);
      isValid = false;
    }
    if (isValid && (currentAnalysisLevel == null || currentAnalysisLevel === '') && siteType === 'Site') {
      this.messagingService.showGrowlError('Trade Area Error', `You must select an Analysis Level before applying a trade area to Sites`);
      isValid = false;
    }
    const newRadii = newModel.tradeAreas.map(ta => ta.radius);
    const prevRadii = cachedValue.map(ta => ta.radius);
    if (JSON.stringify(newRadii) === JSON.stringify(prevRadii)) {
      // radii didn't change, so only visibility has changed
      this.tradeAreaService.updateTradeAreaSelection(newModel.tradeAreas.filter(ta => ta.radius != null).map((ta, i) => ({ taNumber: i + 1, isSelected: ta.isShowing })), siteType);
      isValid = false;
    }
    if (isValid) {
      // save usage metrics
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'tradearea', target: 'radius', action: 'applied' });
      const metricText = newModel.tradeAreas.filter(ta => ta.radius != null).reduce((p, c, i) => `${p}TA${i + 1} ${c.radius} Miles ~`, '');
      this.usageService.createCounterMetric(usageMetricName, metricText, null);

      // Apply the new trade areas
      const transformedAreas = newModel.tradeAreas.map(ta => ({ radius: numberOrNull(ta.radius), selected: ta.isShowing }));
      this.tradeAreaService.applyRadiusTradeArea(transformedAreas, siteType);

      // set up a one-time (take(1)) subscription to zoom to TA
      this.stateService.uniqueIdentifiedGeocodes$.pipe(
        filter(geos => geos != null && geos.length > 0),
        take(1)
      ).subscribe (() => {
        this.tradeAreaService.zoomToTradeArea();
      });
    }
  }

  onDistanceMergeTypeChanged(newMergeType: TradeAreaMergeSpec, siteType: 'Site' | 'Competitor') : void {
    this.tradeAreaService.updateMergeType(newMergeType, siteType);
  }
}
