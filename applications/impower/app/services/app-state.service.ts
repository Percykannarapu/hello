import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { dedupeSimpleSet, distinctArray, filterArray, groupBy, isNumber, mapArray, mapArrayToEntity } from '@val/common';
import { EsriLayerService, EsriMapService, EsriQueryService } from '@val/esri';
import { selectGeoAttributes } from 'app/impower-datastore/state/transient/geo-attributes/geo-attributes.selectors';
import { ImpProjectVarService } from 'app/val-modules/targeting/services/ImpProjectVar.service';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, switchMap, take, tap, throttleTime, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../app.config';
import { ApplyAudiences } from '../impower-datastore/state/transient/audience/audience.actions';
import { RequestAttributes } from '../impower-datastore/state/transient/geo-attributes/geo-attributes.actions';
import { ClearGeoVars } from '../impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { ChangeAnalysisLevel } from '../state/app.actions';
import { FullAppState } from '../state/app.interfaces';
import { layersAreReady, projectIsReady } from '../state/data-shim/data-shim.selectors';
import { CachedObservable } from '../val-modules/api/models/CachedObservable';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes, TradeAreaMergeTypeCodes } from '../val-modules/targeting/targeting.enums';
import { AppLoggingService } from './app-logging.service';
import { AppProjectService } from './app-project.service';

export enum Season {
  Summer = 'summer',
  Winter = 'winter'
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {

  private mapIsReady = new Subject<void>();

  private refreshDynamicContent = new Subject<any>();
  public refreshDynamicContent$: Observable<any> = this.refreshDynamicContent.asObservable().pipe(throttleTime(500));
  public applicationIsReady$ = new BehaviorSubject<boolean>(false);

  private closeOverlayPanel = new Subject<string>();
  public closeOverlayPanel$: Observable<string> = this.closeOverlayPanel.asObservable();

  public currentProject$: CachedObservable<ImpProject> = new BehaviorSubject<ImpProject>(null);
  public currentMaster$: CachedObservable<ImpGeofootprintMaster> = new BehaviorSubject<ImpGeofootprintMaster>(null);
  public analysisLevel$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public taSiteMergeType$: CachedObservable<TradeAreaMergeTypeCodes> = new BehaviorSubject<TradeAreaMergeTypeCodes>(TradeAreaMergeTypeCodes.MergeEach);
  public taCompetitorMergeType$: CachedObservable<TradeAreaMergeTypeCodes> = new BehaviorSubject<TradeAreaMergeTypeCodes>(TradeAreaMergeTypeCodes.MergeEach);
  public projectId$: CachedObservable<number> = new BehaviorSubject<number>(null);
  public season$: CachedObservable<Season> = new BehaviorSubject<Season>(null);

  public allLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeLocations$: Observable<ImpGeofootprintLocation[]>;
  public allClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public allCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;

  public uniqueVisibleGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public uniqueSelectedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public uniqueIdentifiedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public totalGeoCount$: Observable<number>;

  public siteTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public competitorTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());

  private clearUI: Subject<void> = new Subject<void>();
  public clearUI$: Observable<void> = this.clearUI.asObservable();

  private hasSiteProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasSiteProvidedTradeAreas$: CachedObservable<boolean> = this.hasSiteProvidedTradeAreas;

  private hasCompetitorProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasCompetitorProvidedTradeAreas$: CachedObservable<boolean> = this.hasCompetitorProvidedTradeAreas;

  public projectVarsDict$: CachedObservable<any> = new BehaviorSubject<any>(null);

  private getVisibleGeos$ = new Subject<void>();

  private isCollapsed = new BehaviorSubject<boolean>(false);

  public filterFlag: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public filterFlag$: Observable<boolean> = this.filterFlag.asObservable();

  constructor(private projectService: AppProjectService,
              private locationService: ImpGeofootprintLocationService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private geoService: ImpGeofootprintGeoService,
              private projectVarService: ImpProjectVarService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private esriQueryService: EsriQueryService,
              private logger: AppLoggingService,
              private config: AppConfig,
              private store$: Store<FullAppState>) {
    this.setupLocationObservables();
    this.mapIsReady.pipe(
      take(1)
    ).subscribe(() => {
      this.setupApplicationReadyObservable();
      this.setupProjectObservables();
      this.setupGeocodeObservables();
      this.setupTradeAreaObservables();
      this.setupProvidedTaObservables();
      this.setupProjectVarObservables();
    });
  }

  public setProvidedTradeAreas(newValue: boolean, siteType: SuccessfulLocationTypeCodes) : void {
    switch (siteType) {
      case ImpClientLocationTypeCodes.Competitor:
        this.hasCompetitorProvidedTradeAreas.next(newValue);
        break;
      case ImpClientLocationTypeCodes.Site:
        this.hasSiteProvidedTradeAreas.next(newValue);
        break;
    }
  }

  public refreshDynamicControls() : void {
    this.refreshDynamicContent.next();
  }

  public closeOverlays(except?: string) : void {
    this.closeOverlayPanel.next(except);
  }

  public clearUserInterface() : void {
    this.clearUI.next();
  }

  public refreshVisibleGeos() : void {
    this.getVisibleGeos$.next();
  }

  public clearVisibleGeos() : void {
    (this.uniqueVisibleGeocodes$ as BehaviorSubject<string[]>).next([]);
  }

  public notifyMapReady() : void {
    this.mapIsReady.next();
  }

  private setupApplicationReadyObservable() : void {
    combineLatest([this.store$.select(layersAreReady), this.store$.select(projectIsReady)]).pipe(
      map(([layersReady, projectReady]) => layersReady && projectReady),
      distinctUntilChanged()
    ).subscribe(this.applicationIsReady$);
  }

  private setupProjectObservables() : void {
    this.projectService.currentProject$.subscribe(this.currentProject$ as BehaviorSubject<ImpProject>);

    this.currentProject$.pipe(
      filter(project => project != null && project.impGeofootprintMasters != null && project.impGeofootprintMasters.length > 0),
      map(project => project.impGeofootprintMasters[0]),
    ).subscribe(this.currentMaster$ as BehaviorSubject<ImpGeofootprintMaster>);

    this.projectService.currentNullableProject$.pipe(
      map(project => project == null ? null : project.methAnalysis),
      distinctUntilChanged(),
      filter(analysisLevel => analysisLevel != null),
      tap(analysisLevel => this.store$.dispatch(new ChangeAnalysisLevel({analysisLevel: analysisLevel})))
    ).subscribe(this.analysisLevel$ as BehaviorSubject<string>);

    // Setup trade area merge type subscriptions
    this.currentProject$.pipe(
      filter(project => project != null && project.taSiteMergeType != null && project.taSiteMergeType.length > 0),
      map(project => TradeAreaMergeTypeCodes.parse(project.taSiteMergeType)),
      distinctUntilChanged(),
    ).subscribe(this.taSiteMergeType$ as BehaviorSubject<TradeAreaMergeTypeCodes>);
    this.currentProject$.pipe(
      filter(project => project != null && project.taCompetitorMergeType != null && project.taCompetitorMergeType.length > 0),
      map(project => TradeAreaMergeTypeCodes.parse(project.taCompetitorMergeType)),
      distinctUntilChanged(),
    ).subscribe(this.taCompetitorMergeType$ as BehaviorSubject<TradeAreaMergeTypeCodes>);

    this.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.projectId),
      distinctUntilChanged()
    ).subscribe(this.projectId$ as BehaviorSubject<number>);
    this.currentMaster$.pipe(
      filter(master => master != null && master.methSeason != null && master.methSeason.length > 0),
      map(master => (master.methSeason.toUpperCase() === 'S' ? 'summer' : 'winter') as Season),
      distinctUntilChanged()
    ).subscribe(this.season$ as BehaviorSubject<Season>);
  }

  private setupLocationObservables() : void {
    this.allLocations$ = this.locationService.storeObservable.pipe(
      filter(locations => locations != null),
      filterArray(l => l.clientLocationTypeCode === ImpClientLocationTypeCodes.Site || l.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor)
    );
    this.activeLocations$ = this.allLocations$.pipe(
      filterArray(l => l.isActive)
    );
    this.allClientLocations$ = this.allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode === ImpClientLocationTypeCodes.Site)
    );
    this.allCompetitorLocations$ = this.allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode === ImpClientLocationTypeCodes.Competitor)
    );
    this.activeClientLocations$ = this.allClientLocations$.pipe(
      filterArray(l => l.isActive)
    );
    this.activeCompetitorLocations$ = this.allCompetitorLocations$.pipe(
      filterArray(l => l.isActive)
    );
  }

  private setupGeocodeObservables() : void {
    this.totalGeoCount$ = this.geoService.storeObservable.pipe(
      filter(geos => geos != null),
      map(geos => geos.length),
      startWith(0)
    );
    this.geoService.storeObservable.pipe(
      filterArray(geo => geo.isActive),
      mapArray(geo => geo.geocode),
      distinctArray()
    ).subscribe(this.uniqueSelectedGeocodes$ as BehaviorSubject<string[]>);

    const uniqueGeos$ = this.geoService.storeObservable.pipe(
      //withLatestFrom(this.applicationIsReady$),
      //filter(([geos, isReady]) => isReady),
      //map(([geos]) => geos),
      mapArray(geo => geo.geocode),
      map(geocodes => new Set(geocodes))
    );

    uniqueGeos$.pipe(
      map(set => Array.from(set))
    ).subscribe(this.uniqueIdentifiedGeocodes$ as BehaviorSubject<string[]>);

    const completeAttributes$ = this.store$.pipe(
      select(selectGeoAttributes),
      filterArray(e => e.hasOwnProperty('hhld_s') || e.hasOwnProperty('hhld_w')),
      mapArray(e => e.geocode)
    );

    uniqueGeos$.pipe(
      filter(geoSet => geoSet.size > 0),
      withLatestFrom(completeAttributes$),
      map(([requestedGeos, currentGeos]) => dedupeSimpleSet(requestedGeos, new Set(currentGeos))),
      withLatestFrom(this.applicationIsReady$, this.filterFlag$),
      filter(([newGeos, isReady]) => newGeos.size > 0 && isReady),
    ).subscribe(([geoSet, , filterFlag]) => {
      if (filterFlag !== null && filterFlag !== undefined) {
        this.store$.dispatch(new RequestAttributes({ geocodes: geoSet, flag: filterFlag }));
      }else {
        this.store$.dispatch(new RequestAttributes({ geocodes: geoSet}));
      }
      this.store$.dispatch(new ClearGeoVars());
      this.store$.dispatch(new ApplyAudiences({analysisLevel: this.analysisLevel$.getValue()}));
    });

    this.getVisibleGeos$.pipe(
      withLatestFrom(this.analysisLevel$),
      filter(([, analysisLevel]) => analysisLevel != null && analysisLevel.length > 0),
      map(([, analysisLevel]) => this.config.getLayerIdForAnalysisLevel(analysisLevel)),
      switchMap(layerId => this.esriQueryService.queryPortalLayerView(layerId).pipe(
        map(graphics => graphics.filter(g => g.attributes.pob !== 'B').map(g => g.attributes.geocode))
      )),
      map(geos => Array.from(new Set(geos)))
    ).subscribe(this.uniqueVisibleGeocodes$ as BehaviorSubject<string[]>);
  }

  private setupTradeAreaObservables() : void {
    const radialTradeAreas$ = this.tradeAreaService.storeObservable.pipe(
      map(tas => tas.filter(ta => ta.taType.toUpperCase() === 'RADIUS'))
    );
    radialTradeAreas$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Site'),
      map(tas => groupBy(tas, 'taNumber')),
    ).subscribe(this.siteTradeAreas$ as BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>);
    radialTradeAreas$.pipe(
      filterArray(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Competitor'),
      map(tas => groupBy(tas, 'taNumber'))
    ).subscribe(this.competitorTradeAreas$ as BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>);
  }

  private setupProvidedTaObservables() : void {
    this.activeClientLocations$.pipe( distinctUntilChanged() &&
      filterArray(loc => isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3)),
      map(locs => locs.length > 0 )
    ).subscribe(flag => this.hasSiteProvidedTradeAreas.next(flag));
    this.activeCompetitorLocations$.pipe(distinctUntilChanged() &&
      filterArray(loc => isNumber(loc.radius1) || isNumber(loc.radius2) || isNumber(loc.radius3)),
      map(locs => locs.length > 0)
    ).subscribe(flag => this.hasCompetitorProvidedTradeAreas.next(flag));
  }

  private setupProjectVarObservables() : void {
    this.projectVarService.storeObservable.pipe(
      filterArray(pvar => pvar.isActive),
      map(pvars => mapArrayToEntity(pvars,  pvar => pvar.varPk)),
    ).subscribe(this.projectVarsDict$ as BehaviorSubject<any>);
  }

  getCollapseObservable() {
    return this.isCollapsed.asObservable();
  }

  triggerChangeInCollapse(collapse: boolean){
    this.isCollapsed.next(collapse);
  }
}
