import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { distinctUntilChanged, filter, map, tap } from 'rxjs/operators';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintMaster } from '../val-modules/targeting/models/ImpGeofootprintMaster';
import { CachedObservable } from '../val-modules/api/models/CachedObservable';
import { ImpGeofootprintGeoService } from '../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintTradeArea } from '../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { groupBy } from '../val-modules/common/common.utils';
import { ImpProjectService } from '../val-modules/targeting/services/ImpProject.service';
import { AppLayerService } from './app-layer.service';

export enum Season {
  Summer = 'summer',
  Winter = 'winter'
}

@Injectable({
  providedIn: 'root'
})
export class AppStateService {

  public currentProject$: CachedObservable<ImpProject> = new BehaviorSubject<ImpProject>(null);
  public currentMaster$: CachedObservable<ImpGeofootprintMaster> = new BehaviorSubject<ImpGeofootprintMaster>(null);
  public analysisLevel$: CachedObservable<string> = new BehaviorSubject<string>(null);
  public projectId$: CachedObservable<number> = new BehaviorSubject<number>(null);
  public season$: CachedObservable<Season> = new BehaviorSubject<Season>(null);

  public uniqueSelectedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);
  public uniqueIdentifiedGeocodes$: CachedObservable<string[]> = new BehaviorSubject<string[]>([]);

  public siteTradeAreas$: Observable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());
  public competitorTradeAreas$: Observable<Map<number, ImpGeofootprintTradeArea[]>> = new BehaviorSubject<Map<number, ImpGeofootprintTradeArea[]>>(new Map<number, ImpGeofootprintTradeArea[]>());

  constructor(private projectService: ImpProjectService, private geoService: ImpGeofootprintGeoService,
               private tradeAreaService: ImpGeofootprintTradeAreaService) {
    this.setupProjectObservables();
    this.setupGeocodeObservables();
    this.setupTradeAreaObservables();
  }

  private setupProjectObservables() : void {
    this.projectService.storeObservable.pipe(
      filter(projects => projects != null && projects.length > 0 && projects[0] != null),
      map(projects => projects[0])
    ).subscribe(this.currentProject$ as BehaviorSubject<ImpProject>);

    this.currentProject$.pipe(
      filter(project => project != null && project.impGeofootprintMasters != null && project.impGeofootprintMasters.length > 0),
      map(project => project.impGeofootprintMasters[0]),
    ).subscribe(this.currentMaster$ as BehaviorSubject<ImpGeofootprintMaster>);
    this.currentProject$.pipe(
      filter(project => project != null && project.methAnalysis != null && project.methAnalysis.length > 0),
      map(project => project.methAnalysis),
      distinctUntilChanged(),
    ).subscribe(this.analysisLevel$ as BehaviorSubject<string>);
    this.currentProject$.pipe(
      filter(project => project != null),
      map(project => project.projectId),
      distinctUntilChanged()
    ).subscribe(this.projectId$ as BehaviorSubject<number>);
    this.currentMaster$.pipe(
      filter(master => master != null && master.methSeason != null && master.methSeason.length > 0),
      map(master => master.methSeason.toLowerCase() as Season),
      distinctUntilChanged()
    ).subscribe(this.season$ as BehaviorSubject<Season>);
  }

  private setupGeocodeObservables() : void {
    this.geoService.storeObservable.pipe(
      map(geos => geos.filter(g => g.isActive)),
      map(geos => Array.from(new Set(geos.map(g => g.geocode))))
    ).subscribe(this.uniqueSelectedGeocodes$ as BehaviorSubject<string[]>);

    this.geoService.storeObservable.pipe(
      map(geos => Array.from(new Set(geos.map(g => g.geocode))))
    ).subscribe(this.uniqueIdentifiedGeocodes$ as BehaviorSubject<string[]>);
  }

  private setupTradeAreaObservables() : void {
    const radialTradeAreas$ = this.tradeAreaService.storeObservable.pipe(
      map(tas => tas.filter(ta => ta.taType.toUpperCase() === 'RADIUS'))
    );
    this.siteTradeAreas$ = radialTradeAreas$.pipe(
      map(tas => tas.filter(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Site')),
      map(tas => groupBy(tas, 'taNumber')),
    );
    this.competitorTradeAreas$ = radialTradeAreas$.pipe(
      map(tas => tas.filter(ta => ta.impGeofootprintLocation.clientLocationTypeCode === 'Competitor')),
      map(tas => groupBy(tas, 'taNumber'))
    );
  }
}
