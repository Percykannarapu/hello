import { Component, OnInit } from '@angular/core';
import { Subject, Observable } from 'rxjs';
import { filter, map, take, tap, distinctUntilChanged } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppLocationService } from '../../services/app-location.service';
import { AppProjectService } from '../../services/app-project.service';
import { AppStateService } from '../../services/app-state.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes } from '../../val-modules/targeting/targeting.enums';
import { DistanceTradeAreaUiModel, TradeAreaModel } from './distance-trade-area/distance-trade-area-ui.model';
import { AudienceTradeAreaConfig, AudienceDataDefinition } from '../../models/audience-data.model';
import { ValAudienceTradeareaService } from '../../services/app-audience-tradearea.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../state/app.interfaces';
import { ErrorNotification, StopBusyIndicator } from '@val/messaging';
import { CreateTradeAreaUsageMetric } from '../../state/usage/targeting-usage.actions';
import { AppGeoService } from './../../services/app-geo.service';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintGeo } from '../../val-modules/targeting/models/ImpGeofootprintGeo';
import { AppLoggingService } from 'app/services/app-logging.service';

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
  hasSiteProvidedTradeAreas$: Observable<boolean>;
  hasCompetitorProvidedTradeAreas$: Observable<boolean>;

  siteTypes = ImpClientLocationTypeCodes;

  private siteCounts = new Map<SuccessfulLocationTypeCodes, number>();
  private tradeAreaUiCache = new Map<SuccessfulLocationTypeCodes, TradeAreaModel[]>();

  constructor(private stateService: AppStateService,
              private appProjectService: AppProjectService,
              private tradeAreaService: AppTradeAreaService,
              private appLocationService: AppLocationService,
              private config: AppConfig,
              private audienceTradeareaService: ValAudienceTradeareaService,
              private targetAudienceService: TargetAudienceService,
              private locationService: ImpGeofootprintLocationService,
              private appGeoService: AppGeoService,
              private geoService: ImpGeofootprintGeoService,
              private logger: AppLoggingService,
              private store$: Store<LocalAppState>) { }

  ngOnInit() {
    // keep track of locations - need this for validation upon submit of radius trade areas
    this.appLocationService.allClientLocations$.pipe(
      map(sites => sites.length)
    ).subscribe(count => this.siteCounts.set(ImpClientLocationTypeCodes.Site, count));
    this.appLocationService.allCompetitorLocations$.pipe(
      map(competitors => competitors.length)
    ).subscribe(count => this.siteCounts.set(ImpClientLocationTypeCodes.Competitor, count));

    // keep track of the merge flags
    this.siteMergeType$ = this.stateService.taSiteMergeType$;
    this.competitorMergeType$ = this.stateService.taCompetitorMergeType$;

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

    this.hasSiteProvidedTradeAreas$ = this.stateService.hasSiteProvidedTradeAreas$.pipe(distinctUntilChanged());
    this.hasCompetitorProvidedTradeAreas$ = this.stateService.hasCompetitorProvidedTradeAreas$.pipe(distinctUntilChanged());
  }

  onDistanceTradeAreasChanged(newModel: DistanceTradeAreaUiModel, siteType: SuccessfulLocationTypeCodes) {
    // sort the values numerically, putting nulls at the end
    newModel.tradeAreas.sort((a, b) => (a.radius ? Number(a.radius) : Number.MAX_SAFE_INTEGER) - (b.radius ? Number(b.radius) : Number.MAX_SAFE_INTEGER));
    const cachedValue = this.tradeAreaUiCache.get(siteType);

    if (JSON.stringify(newModel.tradeAreas) === JSON.stringify(cachedValue)) return;

    let isValid = true;
    let notification: ErrorNotification = null;
    const currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
    if (!this.siteCounts.has(siteType) || this.siteCounts.get(siteType) < 1) {
      notification = new ErrorNotification({ notificationTitle: 'Trade Area Error', message: `You must add at least 1 ${siteType} before applying a trade area to ${siteType}s` });
      isValid = false;
    }
    if (isValid && (currentAnalysisLevel == null || currentAnalysisLevel === '') && siteType === ImpClientLocationTypeCodes.Site) {
      notification = new ErrorNotification({ notificationTitle: 'Trade Area Error', message: `You must select an Analysis Level before applying a trade area to Sites` });
      isValid = false;
    }
    if (notification) this.store$.dispatch(notification);
    const newRadii = newModel.tradeAreas.map(ta => ta.radius);
    const prevRadii = cachedValue.map(ta => ta.radius);
    if (JSON.stringify(newRadii) === JSON.stringify(prevRadii)) {
      // radii didn't change, so only visibility has changed
      this.tradeAreaService.updateTradeAreaSelection(newModel.tradeAreas.filter(ta => ta.radius != null).map((ta, i) => ({ taNumber: i + 1, isSelected: ta.isShowing })), siteType);
      isValid = false;
    }
    if (isValid) {
      // save usage metrics
      const metricText = newModel.tradeAreas.filter(ta => ta.radius != null).reduce((p, c, i) => `${p}TA${i + 1} ${c.radius} Miles ~`, '');
      this.store$.dispatch(new CreateTradeAreaUsageMetric('radius', 'applied', metricText));

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
    this.appProjectService.updateMergeType(newMergeType, siteType);
  }

  onUpdatedAudienceTAData(form: any) {
    //this.logger.debug.log('Trade Area parent component fired', form);
    const audienceTAConfig: AudienceTradeAreaConfig = {
      analysisLevel: this.stateService.analysisLevel$.getValue() ? this.stateService.analysisLevel$.getValue().toLowerCase() : null,
      digCategoryId: form.audienceIdentifier, // this.getVarId(form.audience),
      locations: null,
      maxRadius: form.maxRadius,
      minRadius: form.minRadius,
      scoreType: form.scoreType,
      weight: form.weight,
      includeMustCover: form.includeMustCover,
      audienceName: form.audience
    };
    this.audienceTradeareaService.updateAudienceTAConfig(audienceTAConfig);
  }

  private getVarId(audienceName: string) : number {
    const targetingVar: AudienceDataDefinition[] = this.targetAudienceService.getAudiences().filter(v => v.audienceName === audienceName && v.audienceSourceType === 'Online');
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
    this.audienceTradeareaService.createAudienceTradearea(this.audienceTradeareaService.getAudienceTAConfig())
    .subscribe(createTASuccessful => {
      const geosToPersist: Array<ImpGeofootprintGeo> = [];
      if (createTASuccessful) {
         // Add the must covers to geosToPersist
         this.appGeoService.ensureMustCoversObs(this.locationService.get(), null).subscribe(results => {
            results.forEach(result => geosToPersist.push(result));
         }
         , err => {
            this.logger.error.log('ERROR occurred ensuring must covers: ', err);
            this.store$.dispatch(new ErrorNotification({ message: 'There was an error creating must covers for the Audience Trade Area' }));
         }
         , () => {
            if (geosToPersist.length > 0) {
              this.logger.info.log('Adding ', geosToPersist.length, ' must covers for audience TA');
              this.geoService.add(geosToPersist);
            }
            else
              this.logger.info.log('No must covers for audience TA');
         });
      }
    },
    error => {
      this.logger.error.log('Error while creating audience tradearea', error);
      this.store$.dispatch(new ErrorNotification({ message: 'There was an error creating the Audience Trade Area' }));
      this.store$.dispatch(new StopBusyIndicator({ key: 'AUDIENCETA' }));
   }
   );
  }
}
