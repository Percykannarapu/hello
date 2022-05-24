import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { isConvertibleToNumber } from '@val/common';
import { ImpGeofootprintTradeAreaService } from 'app/val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, take, takeUntil } from 'rxjs/operators';
import {
  ImpClientLocationTypeCodes,
  SuccessfulLocationTypeCodes,
  TradeAreaMergeTypeCodes,
  TradeAreaTypeCodes
} from '../../../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../../../app.config';
import { AppProjectService } from '../../../services/app-project.service';
import { AppStateService } from '../../../services/app-state.service';
import { AppTradeAreaService } from '../../../services/app-trade-area.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { CreateTradeAreaUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { ImpGeofootprintTradeArea } from '../../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { DistanceTradeAreaUiModel } from './distance-trade-area/distance-trade-area-ui.model';

@Component({
  selector: 'val-trade-area-tab',
  templateUrl: './trade-area-tab.component.html'
})
export class TradeAreaTabComponent implements OnInit, OnDestroy {

  analysisLevel$: Observable<string>;

  maxTradeAreaCount: number = this.config.maxRadiusTradeAreas;
  maxRadius: number = this.config.maxBufferRadius;

  siteTradeAreas$: BehaviorSubject<ImpGeofootprintTradeArea[]> = new BehaviorSubject<ImpGeofootprintTradeArea[]>([]);
  competitorTradeAreas$: BehaviorSubject<ImpGeofootprintTradeArea[]> = new BehaviorSubject<ImpGeofootprintTradeArea[]>([]);

  siteMergeType$: Observable<TradeAreaMergeTypeCodes>;
  competitorMergeType$: Observable<TradeAreaMergeTypeCodes>;

  hasSiteProvidedTradeAreas$: Observable<boolean>;
  hasCompetitorProvidedTradeAreas$: Observable<boolean>;

  hasSites$: Observable<boolean>;
  hasCompetitors$: Observable<boolean>;

  mustCoverText: string;
  customTaText: string;

  siteTypes = ImpClientLocationTypeCodes;

  private destroyed$ = new Subject<void>();
  index: number = -1;

  constructor(private stateService: AppStateService,
              private appProjectService: AppProjectService,
              private tradeAreaService: AppTradeAreaService,
              private config: AppConfig,
              private impTradeAreaService: ImpGeofootprintTradeAreaService,
              private store$: Store<LocalAppState>) { }

  ngOnInit() {
    this.analysisLevel$ = this.stateService.analysisLevel$;

    this.siteMergeType$ = this.stateService.taSiteMergeType$.pipe(distinctUntilChanged());
    this.competitorMergeType$ = this.stateService.taCompetitorMergeType$.pipe(distinctUntilChanged());

    this.stateService.siteTradeAreas$.pipe(takeUntil(this.destroyed$)).subscribe(this.siteTradeAreas$);
    this.stateService.competitorTradeAreas$.pipe(takeUntil(this.destroyed$)).subscribe(this.competitorTradeAreas$);

    this.hasSiteProvidedTradeAreas$ = this.stateService.hasSiteProvidedTradeAreas$.pipe(distinctUntilChanged());
    this.hasCompetitorProvidedTradeAreas$ = this.stateService.hasCompetitorProvidedTradeAreas$.pipe(distinctUntilChanged());

    this.hasSites$ = this.stateService.activeClientLocations$.pipe(map(sites => sites.length > 0));
    this.hasCompetitors$ = this.stateService.activeCompetitorLocations$.pipe(map(sites => sites.length > 0));

    this.stateService.clearUI$.subscribe(() => this.index = -1);
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  onTradeAreasChanged(newModel: DistanceTradeAreaUiModel, siteType: SuccessfulLocationTypeCodes) {
    const key = 'TradeAreaTabApply';
    // this.store$.dispatch(new StartBusyIndicator({ key, message: 'Applying Distance Trade Areas' }));

    setTimeout(() => {
      this.applyTradeAreaChanges(newModel, siteType);
      // this.store$.dispatch(new StopBusyIndicator({ key }));
    });

    this.stateService.uniqueIdentifiedGeocodes$.pipe(
      filter(geos => geos != null && geos.length > 0),
      take(1)
    ).subscribe (() => {
      this.tradeAreaService.zoomToTradeArea();
    });
  }

  deleteTradeArea(newModel: DistanceTradeAreaUiModel, siteType: SuccessfulLocationTypeCodes){
    const tradeAreaModels = newModel.tradeAreas.filter(ta => ta.radius != null);
    const transformedAreas = tradeAreaModels.map(ta => ({ radius: Number(ta.radius), selected: ta.isActive, taNumber: ta.tradeAreaNumber }));
    const tradeAreaFilter = new Set<TradeAreaTypeCodes>([TradeAreaTypeCodes.Radius, TradeAreaTypeCodes.HomeGeo]);
    const currentTradeAreas = this.impTradeAreaService.get()
      .filter(ta => ImpClientLocationTypeCodes.parse(ta.impGeofootprintLocation.clientLocationTypeCode) === siteType &&
                    tradeAreaFilter.has(TradeAreaTypeCodes.parse(ta.taType)));
    this.tradeAreaService.deleteTradeAreas(currentTradeAreas);
  }

  private applyTradeAreaChanges(newModel: DistanceTradeAreaUiModel, siteType: SuccessfulLocationTypeCodes) : void {
    this.appProjectService.updateMergeType(newModel.mergeType, siteType);
    const tradeAreaModels = newModel.tradeAreas.filter(ta => isConvertibleToNumber(ta.radius) && Number(ta.radius) > 0);
    const transformedAreas = tradeAreaModels.map(ta => ({ radius: Number(ta.radius), selected: ta.isActive, taNumber: ta.tradeAreaNumber }));
    const metricText = tradeAreaModels.map(ta => `TA${ta.tradeAreaNumber} ${ta.radius} Miles`).join('~');
    this.store$.dispatch(new CreateTradeAreaUsageMetric('radius', 'applied', metricText));
    this.tradeAreaService.applyRadiusTradeArea(transformedAreas, siteType);
  }

  isMustCover(event: any){
    this.mustCoverText = event ? 'Must Cover - Exists' : 'Must Cover';
  }

  isCustomTa(event: any){
    this.customTaText = event ? 'Custom - Exists' : 'Custom';
  }

  onTabOpen(e) {
     this.index = e.index;
  }
}
