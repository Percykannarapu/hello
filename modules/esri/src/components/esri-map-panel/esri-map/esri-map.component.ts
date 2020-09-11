import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { filter, map, startWith, take } from 'rxjs/operators';
import { EsriUtils } from '../../../core/esri-utils';
import { EsriMapService } from '../../../services/esri-map.service';
import { AppState } from '../../../state/esri.reducers';
import { selectors } from '../../../state/esri.selectors';
import { Authenticate } from '../../../state/init/esri.init.actions';
import { InitializeMap } from '../../../state/map/esri.map.actions';
import { AppLoggingService } from 'app/services/app-logging.service';

@Component({
  selector: 'val-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapComponent implements OnInit {
  @Input() height: number;
  @Input() cursor: string;
  @Input() baseMap: string;
  @Input() batchMode: boolean = false;

  @Output() mapClicked = new EventEmitter<__esri.MapViewImmediateClickEvent>();
  @Output() viewChanged = new EventEmitter<__esri.MapView>();

  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;

  constructor(private mapService: EsriMapService,
              private store$: Store<AppState>,
              private logger: AppLoggingService,
              private zone: NgZone) { }

  private static compareCenters(current: __esri.Point, previous: __esri.Point) : boolean {
    return previous == null || current.x !== previous.x || current.y !== previous.y;
  }

  public ngOnInit() {
    this.store$.dispatch(new Authenticate());
    this.store$.select(selectors.getEsriFeatureReady).pipe(
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.store$.dispatch(new InitializeMap({ domContainer: this.mapViewEl, baseMap: this.baseMap }));
      this.store$.pipe(
        select(selectors.getMapReady),
        filter(ready => ready),
        take(1)
      ).subscribe(() => {
        this.viewChanged.emit(this.mapService.mapView); // one startup firing to get the initial viewpoint
        this.zone.runOutsideAngular(() => {
          EsriUtils.handleMapViewEvent(this.mapService.mapView, 'immediate-click')
            .subscribe(e => this.zone.run(() => this.mapClicked.emit(e)));
          const center$ = EsriUtils.setupWatch(this.mapService.mapView, 'center').pipe(
            filter(result => EsriMapComponent.compareCenters(result.newValue, result.oldValue))
          );
          const scale$ = EsriUtils.setupWatch(this.mapService.mapView, 'scale').pipe(
            filter(result => result.oldValue !== result.newValue)
          );
          const updating$ = EsriUtils.setupWatch(this.mapService.mapView, 'updating').pipe(
            map(result => result.newValue),
            startWith(true)
          );
          const stationary$ = EsriUtils.setupWatch(this.mapService.mapView, 'stationary').pipe(
            map(result => result.newValue),
            startWith(false)
          );
          combineLatest([updating$, stationary$, center$, scale$]).pipe(
            filter(([u, s]) => !u && s)
          ).subscribe(() => this.zone.run(() => this.viewChanged.emit(this.mapService.mapView)));

          this.mapService.mapView.map.allLayers.forEach(layer =>
            EsriUtils.setupWatch(layer, 'visible')
              .subscribe(() => this.zone.run(() => this.viewChanged.emit(this.mapService.mapView))));
        });
      });
    });
    /*
    refresh token for every 50 min
    */
     window.setInterval(() => {
      this.logger.debug.log('token refreshed: ', new Date().toLocaleTimeString()); 
      this.store$.dispatch(new Authenticate()); }, 3000000);
  }
}
