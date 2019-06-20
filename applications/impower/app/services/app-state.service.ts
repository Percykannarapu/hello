import { ApplyAudiences } from './../impower-datastore/state/transient/audience/audience.actions';
import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { dedupeSimpleSet, distinctArray, filterArray, groupBy, isNumber, mapArray, mapArrayToEntity, setsAreEqual } from '@val/common';
import { EsriLayerService, EsriMapService, EsriQueryService } from '@val/esri';
import { BehaviorSubject, combineLatest, Observable, of, Subject } from 'rxjs';
import { catchError, distinctUntilChanged, filter, map, pairwise, startWith, switchMap, tap, throttleTime, withLatestFrom } from 'rxjs/operators';
import { RequestAttributes } from '../impower-datastore/state/geo-attributes/geo-attributes.actions';
import { selectGeoAttributes } from '../impower-datastore/state/impower-datastore.selectors';
import { ChangeAnalysisLevel } from '../state/app.actions';
import { FullAppState } from '../state/app.interfaces';
import { projectIsReady } from '../state/data-shim/data-shim.selectors';
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
import { ImpProjectVarService } from 'app/val-modules/targeting/services/ImpProjectVar.service';
import { AppProjectService } from './app-project.service';

export enum Season {
  Summer = 'summer',
  Winter = 'winter'
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {

  private refreshDynamicContent = new Subject<any>();
  public refreshDynamicContent$: Observable<any> = this.refreshDynamicContent.asObservable().pipe(throttleTime(500));
  public applicationIsReady$: Observable<boolean>;

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

  public siteTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public competitorTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());

  private clearUI: Subject<void> = new Subject<void>();
  public clearUI$: Observable<void> = this.clearUI.asObservable();

  private hasSiteProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasSiteProvidedTradeAreas$: CachedObservable<boolean> = this.hasSiteProvidedTradeAreas;

  private hasCompetitorProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasCompetitorProvidedTradeAreas$: CachedObservable<boolean> = this.hasCompetitorProvidedTradeAreas;

  public projectVarsDict$: CachedObservable<any> = new BehaviorSubject<any>(null);

  private setVisibleGeosForLayer$ = new Subject<string>();

  private isCollapsed = new BehaviorSubject<boolean>(false);

  constructor(private projectService: AppProjectService,
              private locationService: ImpGeofootprintLocationService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private geoService: ImpGeofootprintGeoService,
              private projectVarService: ImpProjectVarService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private esriQueryService: EsriQueryService,
              private logger: AppLoggingService,
              private store$: Store<FullAppState>) {
    this.setupApplicationReadyObservable();
    this.setupProjectObservables();
    this.setupLocationObservables();
    this.setupGeocodeObservables();
    this.setupTradeAreaObservables();
    this.setupProvidedTaObservables();
    this.setupProjectVarObservables();
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

  public setVisibleGeocodes(layerId: string) : void {
    this.setVisibleGeosForLayer$.next(layerId);
  }

  private setupApplicationReadyObservable() : void {
    const projectReady$ = this.store$.pipe(select(projectIsReady));
    this.applicationIsReady$ =
      combineLatest(this.esriLayerService.layersReady$, projectReady$).pipe(
        map(([layersReady, projectReady]) => layersReady && projectReady),
        distinctUntilChanged()
      );
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
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0 && (l.clientLocationTypeCode === 'Site' || l.clientLocationTypeCode === 'Competitor'))
    );
    this.activeLocations$ = this.allLocations$.pipe(
      filterArray(l => l.isActive)
    );
    this.allClientLocations$ = this.allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode === 'Site')
    );
    this.allCompetitorLocations$ = this.allLocations$.pipe(
      filterArray(l => l.clientLocationTypeCode === 'Competitor')
    );
    this.activeClientLocations$ = this.allClientLocations$.pipe(
      filterArray(l => l.isActive === true)
    );
    this.activeCompetitorLocations$ = this.allCompetitorLocations$.pipe(
      filterArray(l => l.isActive === true)
    );
  }

  private setupGeocodeObservables() : void {
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
      withLatestFrom(this.applicationIsReady$),
      filter(([newGeos, isReady]) => newGeos.size > 0 && isReady),
    ).subscribe(([geoSet]) => {
      this.store$.dispatch(new RequestAttributes({ geocodes: geoSet }));
console.log('### uniqueGeos$.pipe - ApplyAudiences');
      this.store$.dispatch(new ApplyAudiences({analysisLevel: this.analysisLevel$.getValue()}));
    });

    this.setVisibleGeosForLayer$.pipe(
      switchMap(layerId => this.esriQueryService.queryPortalLayerView(layerId).pipe(
        map(graphics => graphics.map(g => g.attributes.geocode))
      )),
      map(geos => new Set(geos)),
      startWith(null),
      pairwise(),
      filter(([previous, current]) => !setsAreEqual(current, previous)),
      map(([, geoSet]) => Array.from(geoSet)),
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

  stopObservingCollapse(){
    this.isCollapsed.complete();
  }
}
