import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { distinctArray, filterArray, mapArray } from '../val-modules/common/common.rxjs';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { CachedObservable } from '../val-modules/api/models/CachedObservable';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { groupBy } from '../val-modules/common/common.utils';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { EsriMapService } from '../esri-modules/core/esri-map.service';
import { EsriLayerService } from '../esri-modules/layers/esri-layer.service';
import { MapStateTypeCodes } from '../models/app.enums';

export enum Season {
  Summer = 'summer',
  Winter = 'winter'
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {

  public applicationIsReady$: Observable<boolean>;

  private currentMapState = new BehaviorSubject<MapStateTypeCodes>(MapStateTypeCodes.Popups);
  public currentMapState$ = this.currentMapState.asObservable();

  private projectIsLoading = new BehaviorSubject<boolean>(false);
  public projectIsLoading$: Observable<boolean> = this.projectIsLoading.asObservable();

  public currentProject$: CachedObservable<ImpProject> = new BehaviorSubject<ImpProject>(null);
  public currentMaster$: CachedObservable<ImpGeofootprintMaster> = new BehaviorSubject<ImpGeofootprintMaster>(null);
  public analysisLevel$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public taSiteMergeType$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public taCompetitorMergeType$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public projectId$: CachedObservable<number> = new BehaviorSubject<number>(null);
  public season$: CachedObservable<Season> = new BehaviorSubject<Season>(null);

  public uniqueSelectedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public uniqueIdentifiedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);

  public siteTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public competitorTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public clearUserInterface: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  constructor(private projectService: ImpProjectService,
               private geoService: ImpGeofootprintGeoService,
               private tradeAreaService: ImpGeofootprintTradeAreaService,
               private esriMapService: EsriMapService,
               private esriLayerService: EsriLayerService) {
    this.setupApplicationReadyObservable();
    this.setupProjectObservables();
    this.setupGeocodeObservables();
    this.setupTradeAreaObservables();
  }

  public loadProject(projectId: number) : Observable<ImpProject> {
    this.projectIsLoading.next(true);
    return this.projectService.loadProject(projectId, true).pipe(
      tap(null, null, () => this.projectIsLoading.next(false))
    );
  }

  public setMapState(newState: MapStateTypeCodes) : void {
    this.currentMapState.next(newState);
  }

  private setupApplicationReadyObservable() : void {
    this.applicationIsReady$ =
      combineLatest(this.esriMapService.onReady$, this.esriLayerService.layersReady$, this.projectIsLoading$).pipe(
        map(([mapReady, layersReady, projectLoading]) => mapReady && layersReady && !projectLoading)
      );
  }

  private setupProjectObservables() : void {
    this.projectService.storeObservable.pipe(
      filter(projects => projects != null && projects.length > 0 && projects[0] != null),
      map(projects => projects[0]),
    ).subscribe(this.currentProject$ as BehaviorSubject<ImpProject>);

    this.currentProject$.pipe(
      filter(project => project != null && project.impGeofootprintMasters != null && project.impGeofootprintMasters.length > 0),
      map(project => project.impGeofootprintMasters[0]),
    ).subscribe(this.currentMaster$ as BehaviorSubject<ImpGeofootprintMaster>);
    this.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.methAnalysis),
      distinctUntilChanged(),
    ).subscribe(this.analysisLevel$ as BehaviorSubject<string>);

    // Setup trade area merge type subscriptions
    this.currentProject$.pipe(
      filter(project => project != null && project.taSiteMergeType != null && project.taSiteMergeType.length > 0),
      map(project => project.taSiteMergeType),
      distinctUntilChanged(),
    ).subscribe(this.taSiteMergeType$ as BehaviorSubject<string>);
    this.currentProject$.pipe(
      filter(project => project != null && project.taCompetitorMergeType != null && project.taCompetitorMergeType.length > 0),
      map(project => project.taCompetitorMergeType),
      distinctUntilChanged(),
    ).subscribe(this.taCompetitorMergeType$ as BehaviorSubject<string>);

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

  private setupGeocodeObservables() : void {
    this.geoService.storeObservable.pipe(
      filterArray(geo => geo.isActive),
      mapArray(geo => geo.geocode),
      distinctArray()
    ).subscribe(this.uniqueSelectedGeocodes$ as BehaviorSubject<string[]>);

    this.geoService.storeObservable.pipe(
      mapArray(geo => geo.geocode),
      distinctArray()
    ).subscribe(this.uniqueIdentifiedGeocodes$ as BehaviorSubject<string[]>);
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

  public getClearUserInterfaceObs() : Observable<boolean> {
    return this.clearUserInterface.asObservable();
  }
}
