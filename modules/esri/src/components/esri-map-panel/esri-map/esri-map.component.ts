import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, NgZone, OnInit, Output, ViewChild } from '@angular/core';
import { select, Store } from '@ngrx/store';
import { combineLatest } from 'rxjs';
import { debounceTime, filter, map, take } from 'rxjs/operators';
import { MapViewImmediateClickEvent } from '../../../core/esri-event-shims';
import { EsriUtils } from '../../../core/esri-utils';
import { EsriMapService } from '../../../services/esri-map.service';
import { LoggingService } from '../../../services/logging.service';
import { AppState } from '../../../state/esri.reducers';
import { selectors } from '../../../state/esri.selectors';
import { Authenticate } from '../../../state/init/esri.init.actions';
import { InitializeMap } from '../../../state/map/esri.map.actions';

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

  @Output() mapClicked = new EventEmitter<MapViewImmediateClickEvent>();
  @Output() viewChanged = new EventEmitter<__esri.MapView>();

  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;

  constructor(private mapService: EsriMapService,
              private store$: Store<AppState>,
              private logger: LoggingService,
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
        this.zone.runOutsideAngular(() => {
          EsriUtils.handleMapViewEvent(this.mapService.mapView, 'immediate-click')
            .subscribe(e => this.zone.run(() => this.mapClicked.emit(e)));
          const center$ = EsriUtils.setupWatch(this.mapService.mapView, 'center', true).pipe(
            filter(result => EsriMapComponent.compareCenters(result.newValue, result.oldValue)),
          );
          const scale$ = EsriUtils.setupWatch(this.mapService.mapView, 'scale', true).pipe(
            filter(result => result.oldValue !== result.newValue),
          );
          const height$ = EsriUtils.setupWatch(this.mapService.mapView, 'height', true).pipe(
            filter(result => result.oldValue !== result.newValue),
          );
          const updating$ = EsriUtils.setupWatch(this.mapService.mapView, 'updating', true).pipe(
            map(result => result.newValue),
          );
          combineLatest([updating$, center$, scale$, height$]).pipe(
            filter(([updating]) => !updating),
            debounceTime(50)
          ).subscribe(() => this.zone.run(() => this.viewChanged.emit(this.mapService.mapView)));
        });
      });
    });
  }
}
