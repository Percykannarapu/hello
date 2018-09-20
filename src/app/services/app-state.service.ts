import { Injectable } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { EsriQueryService } from '../esri/services/esri-query.service';
import { distinctArray, filterArray, mapArray } from '../val-modules/common/common.rxjs';
import { ImpGeofootprintLocation } from '../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { CachedObservable } from '../val-modules/api/models/CachedObservable';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintLocationService } from '../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { groupBy } from '../val-modules/common/common.utils';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { EsriMapService } from '../esri/services/esri-map.service';
import { EsriLayerService } from '../esri/services/esri-layer.service';
import { AppLoggingService } from './app-logging.service';
import { ImpClientLocationTypeCodes, SuccessfulLocationTypeCodes } from '../val-modules/targeting/targeting.enums';

export enum Season {
  Summer = 'summer',
  Winter = 'winter'
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {

  private refreshDynamicContent = new Subject<any>();
  public refreshDynamicContent$: Observable<any> = this.refreshDynamicContent.asObservable();
  public applicationIsReady$: Observable<boolean>;

  private closeOverlayPanel = new Subject<string>();
  public closeOverlayPanel$: Observable<string> = this.closeOverlayPanel.asObservable();

  private projectIsLoading = new BehaviorSubject<boolean>(false);
  public projectIsLoading$: Observable<boolean> = this.projectIsLoading.asObservable();

  public currentProject$: CachedObservable<ImpProject> = new BehaviorSubject<ImpProject>(null);
  public currentMaster$: CachedObservable<ImpGeofootprintMaster> = new BehaviorSubject<ImpGeofootprintMaster>(null);
  public analysisLevel$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public taSiteMergeType$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public taCompetitorMergeType$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public projectId$: CachedObservable<number> = new BehaviorSubject<number>(null);
  public season$: CachedObservable<Season> = new BehaviorSubject<Season>(null);

  public allClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeClientLocations$: Observable<ImpGeofootprintLocation[]>;
  public allCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;
  public activeCompetitorLocations$: Observable<ImpGeofootprintLocation[]>;

  private uniqueVisibleGeocodes = new BehaviorSubject<string[]>([]);
  public uniqueVisibleGeocodes$: CachedObservable<string[]> = this.uniqueVisibleGeocodes;
  public uniqueSelectedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public uniqueIdentifiedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);

  public siteTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public competitorTradeAreas$: CachedObservable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public clearUserInterface: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);

  private hasSiteProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasSiteProvidedTradeAreas$: CachedObservable<boolean> = this.hasSiteProvidedTradeAreas;

  private hasCompetitorProvidedTradeAreas = new BehaviorSubject<boolean>(false);
  public hasCompetitorProvidedTradeAreas$: CachedObservable<boolean> = this.hasCompetitorProvidedTradeAreas;

  constructor(private projectService: ImpProjectService,
              private locationService: ImpGeofootprintLocationService,
              private geoService: ImpGeofootprintGeoService,
              private tradeAreaService: ImpGeofootprintTradeAreaService,
              private esriMapService: EsriMapService,
              private esriLayerService: EsriLayerService,
              private esriQueryService: EsriQueryService,
              private logger: AppLoggingService) {
    this.setupApplicationReadyObservable();
    this.setupProjectObservables();
    this.setupLocationObservables();
    this.setupGeocodeObservables();
    this.setupTradeAreaObservables();
  }

  public loadProject(projectId: number) : Observable<ImpProject> {
    this.projectIsLoading.next(true);
    return this.projectService.loadProject(projectId, true).pipe(
      tap(null, null, () => this.projectIsLoading.next(false))
    );
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

  public setVisibleGeocodes(layerId: string, extent: __esri.Extent) : void {
    this.esriQueryService.queryPortalLayerView(layerId, false, extent).pipe(
      mapArray(g => g.attributes.geocode),
      distinctArray()
    ).subscribe(geos => this.uniqueVisibleGeocodes.next(geos));
  }

  private setupApplicationReadyObservable() : void {
    this.applicationIsReady$ =
      combineLatest(this.esriLayerService.layersReady$, this.projectIsLoading$).pipe(
        tap(([layersReady, projectLoading]) => this.logger.debug('Application Is Ready constituents: ', { layersReady, projectLoading })),
        map(([layersReady, projectLoading]) => layersReady && !projectLoading)
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

  private setupLocationObservables() : void {
    const locationsWithType$ = this.locationService.storeObservable.pipe(
      filter(locations => locations != null),
      filterArray(l => l.clientLocationTypeCode != null && l.clientLocationTypeCode.length > 0)
    );
    this.allClientLocations$ = locationsWithType$.pipe(
      filterArray(l => l.clientLocationTypeCode === 'Site')
    );
    this.allCompetitorLocations$ = locationsWithType$.pipe(
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
    return this.clearUserInterface.asObservable().pipe(filter(flag => flag));
  }
}
