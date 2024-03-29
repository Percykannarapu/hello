import { Injectable } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { filterArray, isConvertibleToNumber, isNotNil } from '@val/common';
import { EsriLayerService, EsriMapService, EsriQueryService } from '@val/esri';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, startWith, take, tap, withLatestFrom } from 'rxjs/operators';
import {
  ImpClientLocationTypeCodes,
  SuccessfulLocationTypeCodes,
  TradeAreaMergeTypeCodes,
  TradeAreaTypeCodes
} from '../../worker-shared/data-model/impower.data-model.enums';
import { AppConfig } from '../app.config';
import { AnalysisLevel } from '../common/models/ui-enums';
import * as ValSort from '../common/valassis-sorters';
import * as fromAppStateSelectors from '../impower-datastore/state/application-state/application-state.selectors';
import { DynamicVariable } from '../impower-datastore/state/transient/dynamic-variable.model';
import { getMetricVarEntities } from '../impower-datastore/state/transient/metric-vars/metric-vars.selectors';
import { ChangeAnalysisLevel } from '../state/app.actions';
import { FullAppState } from '../state/app.interfaces';
import { layersAreReady, projectIsReady } from '../state/data-shim/data-shim.selectors';
import { CachedObservable } from '../val-modules/api/models/CachedObservable';
import { ImpGeofootprintGeo } from '../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
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
  public applicationIsReady$ = new BehaviorSubject<boolean>(false);
  public networkIsOnline$: CachedObservable<boolean> = new BehaviorSubject<boolean>(true);

  private closeOverlayPanel = new Subject<string>();
  public closeOverlayPanel$: Observable<string> = this.closeOverlayPanel.asObservable();

  public currentProject$: CachedObservable<ImpProject> = new BehaviorSubject<ImpProject>(null);
  public currentMaster$: CachedObservable<ImpGeofootprintMaster> = new BehaviorSubject<ImpGeofootprintMaster>(null);
  public analysisLevel$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public analysisLevelEnum$: CachedObservable<AnalysisLevel> = new BehaviorSubject<AnalysisLevel>(null);
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
  public allLocationCount$: Observable<number>;
  public clientLocationCount$: Observable<number>;

  public uniqueSelectedGeocodeSet$: Observable<Set<string>>;
  public uniqueIdentifiedGeocodeSet$: Observable<Set<string>>;
  public uniqueSelectedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public uniqueIdentifiedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public totalGeoCount$: Observable<number>;

  public siteTradeAreas$: Observable<ImpGeofootprintTradeArea[]>;
  public competitorTradeAreas$: Observable<ImpGeofootprintTradeArea[]>;
  public tradeAreaCount$: Observable<number>;

  private clearUI: Subject<void> = new Subject<void>();
  public clearUI$: Observable<void> = this.clearUI.asObservable();

  private hasSiteProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasSiteProvidedTradeAreas$: CachedObservable<boolean> = this.hasSiteProvidedTradeAreas;

  private hasCompetitorProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasCompetitorProvidedTradeAreas$: CachedObservable<boolean> = this.hasCompetitorProvidedTradeAreas;

  private getVisibleGeos$ = new Subject<void>();

  public filterFlag: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private projectService: AppProjectService,
              private locationService: ImpGeofootprintLocationService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private geoService: ImpGeofootprintGeoService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private esriQueryService: EsriQueryService,
              private logger: AppLoggingService,
              private config: AppConfig,
              private store$: Store<FullAppState>) {
    this.setupLocationObservables();
    this.setupTradeAreaObservables();
    this.setupGeocodeObservables();
    this.mapIsReady.pipe(
      take(1)
    ).subscribe(() => {
      this.setupApplicationReadyObservable();
      this.setupProjectObservables();
      this.setupProvidedTaObservables();
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

  public closeOverlays(except?: string) : void {
    this.closeOverlayPanel.next(except);
  }

  public clearUserInterface() : void {
    this.clearUI.next();
  }

  public refreshVisibleGeos() : void {
    this.getVisibleGeos$.next();
  }

  public notifyMapReady() : void {
    this.mapIsReady.next();
  }

  private setupApplicationReadyObservable() : void {
    const projectReady$ = this.store$.select(projectIsReady).pipe(distinctUntilChanged());
    const layersReady$ = this.store$.select(layersAreReady).pipe(distinctUntilChanged());

    combineLatest([projectReady$, layersReady$]).pipe(
      map(([project, layers]) => project && layers),
      distinctUntilChanged()
    ).subscribe(this.applicationIsReady$);

    this.store$.select(fromAppStateSelectors.networkIsOnline).subscribe(this.networkIsOnline$ as BehaviorSubject<boolean>);
  }

  private setupProjectObservables() : void {
    this.projectService.currentProject$.subscribe(this.currentProject$ as BehaviorSubject<ImpProject>);

    this.currentProject$.pipe(
      filter(project => project != null && project.impGeofootprintMasters != null && project.impGeofootprintMasters.length > 0),
      map(project => project.impGeofootprintMasters[0]),
    ).subscribe(this.currentMaster$ as BehaviorSubject<ImpGeofootprintMaster>);

    const projectAnalysisString$ = this.projectService.currentNullableProject$.pipe(
      map(project => project == null ? null : project.methAnalysis),
      distinctUntilChanged()
    );

    projectAnalysisString$.pipe(
      filter(analysisLevel => analysisLevel != null && analysisLevel.length > 0),
    ).subscribe(this.analysisLevel$ as BehaviorSubject<string>);

    projectAnalysisString$.pipe(
      map(als => AnalysisLevel.parse(als, false)),
      tap(analysisLevel => this.store$.dispatch(ChangeAnalysisLevel({ analysisLevel: analysisLevel })))
    ).subscribe(this.analysisLevelEnum$ as BehaviorSubject<AnalysisLevel>);

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
    this.allLocationCount$ = this.allLocations$.pipe(map(l => l.length));
    this.clientLocationCount$ = this.activeClientLocations$.pipe(map(l => l.length));
  }

  private setupGeocodeObservables() : void {
    this.totalGeoCount$ = this.geoService.storeObservable.pipe(
      filter(geos => geos != null),
      map(geos => geos.length),
      startWith(0)
    );
    const validGeos$ = this.geoService.storeObservable.pipe(
      filter(geos => geos != null)
    );
    const geoSplit$ = validGeos$.pipe(
      map(geos => {
        const allGeocodeSet = new Set<string>();
        const activeGeocodeSet = new Set<string>();
        const allGeoLocations = [];
        const allGeocodeArray = [];
        const activeGeocodeArray = [];
        geos.forEach(geo => {
          if (!allGeocodeSet.has(geo.geocode)) {
            allGeocodeSet.add(geo.geocode);
            allGeocodeArray.push(geo.geocode);
            allGeoLocations.push(geo);
          }
          if (geo.isActive && !activeGeocodeSet.has(geo.geocode)) {
            activeGeocodeSet.add(geo.geocode);
            activeGeocodeArray.push(geo.geocode);
          }
        });
        return [allGeocodeSet, allGeocodeArray, activeGeocodeSet, activeGeocodeArray, allGeoLocations] as [Set<string>, string[], Set<string>, string[], ImpGeofootprintGeo[]];
      })
    );
    this.uniqueSelectedGeocodeSet$ = geoSplit$.pipe(
      map(([, , activeGeocodeSet]) => activeGeocodeSet)
    );
    this.uniqueIdentifiedGeocodeSet$ = geoSplit$.pipe(
      map(([allGeocodeSet]) => allGeocodeSet)
    );

    geoSplit$.pipe(
      map(([, , , activeGeocodes]) => activeGeocodes)
    ).subscribe(this.uniqueSelectedGeocodes$ as BehaviorSubject<string[]>);

    geoSplit$.pipe(
      map(([, allGeocodes]) => allGeocodes)
    ).subscribe(this.uniqueIdentifiedGeocodes$ as BehaviorSubject<string[]>);

    this.store$.pipe(select(getMetricVarEntities)).pipe(
      withLatestFrom(this.geoService.storeObservable, this.currentProject$)
    ).subscribe(([attrs, geos, project]) => {
      this.prepGeoFields(geos, attrs, project);
    });
  }

  private setupTradeAreaObservables() : void {
    this.siteTradeAreas$ = combineLatest([this.activeClientLocations$, this.tradeAreaService.storeObservable]).pipe(
      filter(([sites]) => sites != null && sites.length > 0),
      map(([sites]) => sites[0]),
      filter(firstSite => firstSite != null && firstSite.impGeofootprintTradeAreas != null && firstSite.impGeofootprintTradeAreas.length > 0),
      map(firstSite => firstSite.impGeofootprintTradeAreas.filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius)),
      map(tradeAreas => tradeAreas.sort(ValSort.TradeAreaByTaNumber))
    );
    this.competitorTradeAreas$ = combineLatest([this.activeCompetitorLocations$, this.tradeAreaService.storeObservable]).pipe(
      filter(([sites]) => sites != null && sites.length > 0),
      map(([sites]) => sites[0]),
      filter(firstSite => firstSite != null && firstSite.impGeofootprintTradeAreas != null && firstSite.impGeofootprintTradeAreas.length > 0),
      map(firstSite => firstSite.impGeofootprintTradeAreas.filter(ta => TradeAreaTypeCodes.parse(ta.taType) === TradeAreaTypeCodes.Radius)),
      map(tradeAreas => tradeAreas.sort(ValSort.TradeAreaByTaNumber)),
    );
    this.tradeAreaCount$ = this.tradeAreaService.storeObservable.pipe(
      filter(ta => ta != null),
      map(tradeAreas => tradeAreas.reduce((p, ta) => {
        if (ta.impGeofootprintLocation.clientLocationTypeCode === 'Site' && ta.isActive) p++;
        return p;
      }, 0))
    );
  }

  private setupProvidedTaObservables() : void {
    this.activeClientLocations$.pipe( distinctUntilChanged() &&
      filterArray(loc => isConvertibleToNumber(loc.radius1) || isConvertibleToNumber(loc.radius2) || isConvertibleToNumber(loc.radius3)),
      map(locs => locs.length > 0 )
    ).subscribe(flag => this.hasSiteProvidedTradeAreas.next(flag));
    this.activeCompetitorLocations$.pipe(distinctUntilChanged() &&
      filterArray(loc => isConvertibleToNumber(loc.radius1) || isConvertibleToNumber(loc.radius2) || isConvertibleToNumber(loc.radius3)),
      map(locs => locs.length > 0)
    ).subscribe(flag => this.hasCompetitorProvidedTradeAreas.next(flag));
  }

  private prepGeoFields(geos: ImpGeofootprintGeo[], attributes: { [geocode: string] : DynamicVariable }, project: ImpProject) : void {
    const season = project?.impGeofootprintMasters?.[0]?.methSeason;
    if (isNotNil(season)) {
      const hhcField = season === 'S' ? 14031 : 14032; // TODO: magic numbers
      let needsUpdate = false;
      geos.forEach(geo => {
        const currentAttr = attributes[geo.geocode];
        // TODO: Mutates the geo entity. Bad Developer. No.
        if (isNotNil(currentAttr) && isNotNil(currentAttr[hhcField])) {
          const newValue = Number(currentAttr[hhcField]);
          if (geo.hhc !== newValue) {
            geo.hhc = Number(currentAttr[hhcField]);
            needsUpdate = true;
          }
        }
      });
      if (needsUpdate) this.geoService.makeDirty();
    }
  }
}
