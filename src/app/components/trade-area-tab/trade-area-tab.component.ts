import { Component, OnInit } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import { Subject } from 'rxjs/Subject';
import { filter, map, take, tap, distinctUntilChanged } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppLocationService } from '../../services/app-location.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { UsageService } from '../../services/usage.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { DistanceTradeAreaUiModel, TradeAreaModel } from './distance-trade-area/distance-trade-area-ui.model';
import { AudienceTradeAreaConfig, AudienceDataDefinition } from '../../models/audience-data.model';
import { ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';

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

  maxTradeAreaCount: number = this.config.maxRadiusTradeAreas;
  maxRadius: number = this.config.maxBufferRadius;

  siteTradeAreas$: Observable<TradeAreaModel[]>;
  competitorTradeAreas$: Observable<TradeAreaModel[]>;
  siteMergeType$: Observable<TradeAreaMergeTypeCodes>;
  competitorMergeType$: Observable<TradeAreaMergeTypeCodes>;
  audienceTAConfig$: Observable<AudienceTradeAreaConfig>;
  currentAudiences$: Observable<AudienceDataDefinition[]>;
  currentLocationsCount$: Subject<number> = new Subject<number>();

  siteTypes = ImpClientLocationTypeCodes;

  private siteCounts = new Map<SuccessfulLocationTypeCodes, number>();
  private tradeAreaUiCache = new Map<SuccessfulLocationTypeCodes, TradeAreaModel[]>();

  constructor(private stateService: AppStateService,
               private messagingService: AppMessagingService,
               private tradeAreaService: AppTradeAreaService,
               private usageService: UsageService,
               private appLocationService: AppLocationService,
               private config: AppConfig,
               private audienceTradeareaService: ValAudienceTradeareaService,
               private targetAudienceService: TargetAudienceService,
               private locationService: ImpGeofootprintLocationService) { }

  ngOnInit() {
    // keep track of locations - need this for validation upon submit of radius trade areas
    this.appLocationService.allClientLocations$.pipe(
      map(sites => sites.length)
    ).subscribe(count => this.siteCounts.set(ImpClientLocationTypeCodes.Site, count));
    this.appLocationService.allCompetitorLocations$.pipe(
      map(competitors => competitors.length)
    ).subscribe(count => this.siteCounts.set(ImpClientLocationTypeCodes.Competitor, count));

    // keep track of the merge flags
    this.siteMergeType$ = this.tradeAreaService.siteTradeAreaMerge$;
    this.competitorMergeType$ = this.tradeAreaService.competitorTradeAreaMerge$;

    // keep track of trade areas
    this.siteTradeAreas$ = this.stateService.siteTradeAreas$.pipe(
      tradeAreaExtract(this.maxTradeAreaCount),
      mapToUiTradeAreas(this.defaultTradeArea),
      tap(models => this.tradeAreaUiCache.set(ImpClientLocationTypeCodes.Site, models))
    );
    this.competitorTradeAreas$ = this.stateService.competitorTradeAreas$.pipe(
      tradeAreaExtract(this.maxTradeAreaCount),
      mapToUiTradeAreas(this.defaultTradeArea),
      tap(models => this.tradeAreaUiCache.set(ImpClientLocationTypeCodes.Competitor, models))
    );

    this.audienceTAConfig$ = this.audienceTradeareaService.audienceTAConfig$.pipe(distinctUntilChanged());
    this.currentAudiences$ = this.targetAudienceService.audiences$.pipe(
      map(audiences => audiences.filter(audience => audience.audienceSourceName !== 'Audience-TA'))
    );
    this.locationService.storeObservable.subscribe(l => {
      this.currentLocationsCount$.next(l.length);
    });
  }

  onDistanceTradeAreasChanged(newModel: DistanceTradeAreaUiModel, siteType: SuccessfulLocationTypeCodes) {
    // sort the values numerically, putting nulls at the end
    newModel.tradeAreas.sort((a, b) => (a.radius ? Number(a.radius) : Number.MAX_SAFE_INTEGER) - (b.radius ? Number(b.radius) : Number.MAX_SAFE_INTEGER));
    const cachedValue = this.tradeAreaUiCache.get(siteType);

    if (JSON.stringify(newModel.tradeAreas) === JSON.stringify(cachedValue)) return;

    let isValid = true;
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    if (!this.siteCounts.has(siteType) || this.siteCounts.get(siteType) < 1) {
      this.messagingService.showErrorNotification('Trade Area Error', `You must add at least 1 ${siteType} before applying a trade area to ${siteType}s`);
      isValid = false;
    }
    if (isValid && (currentAnalysisLevel == null || currentAnalysisLevel === '') && siteType === ImpClientLocationTypeCodes.Site) {
      this.messagingService.showErrorNotification('Trade Area Error', `You must select an Analysis Level before applying a trade area to Sites`);
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

  onDistanceMergeTypeChanged(newMergeType: TradeAreaMergeTypeCodes, siteType: SuccessfulLocationTypeCodes) : void {
    this.tradeAreaService.updateMergeType(newMergeType, siteType);
  }

  onUpdatedAudienceTAData(form: any) {
    const audienceTAConfig: AudienceTradeAreaConfig = {
      analysisLevel: this.stateService.analysisLevel$.getValue() ? this.stateService.analysisLevel$.getValue().toLowerCase() : null,
      digCategoryId: this.getVarId(form.audience),
      locations: null,
      maxRadius: form.maxRadius,
      minRadius: form.minRadius,
      scoreType: form.scoreType,
      weight: form.weight,
      includeMustCover: form.includeMustCover
    };
    this.audienceTradeareaService.updateAudienceTAConfig(audienceTAConfig);
  }

  private getVarId(audienceName: string) : number {
    const targetingVar: AudienceDataDefinition[] = this.targetAudienceService.getAudiences().filter(v => v.audienceName === audienceName && v.audienceSourceName === 'Online');
    let id: number;
    if (targetingVar.length > 0)
      id = Number(targetingVar[0].secondaryId.replace(',', ''));
    if (Number.isNaN(id)) {
      return null;
    }
    return id;
  }

  onRunAudienceTA(run: boolean) {
    if (!run) return;
    const errorTitle: string = 'Audience Trade Area Error';
    this.audienceTradeareaService.createAudienceTradearea(this.audienceTradeareaService.getAudienceTAConfig())
    .subscribe(result => {
      if (!result) {
        this.messagingService.showErrorNotification(errorTitle, 'Error while creating Audience Trade Area');
      }
    },
    error => {
      console.error('Error while creating audience tradearea', error);
      this.messagingService.showErrorNotification(errorTitle, 'Error while creating Audience Trade Area');
      this.messagingService.stopSpinnerDialog('AUDIENCETA');
    });
  }
}
