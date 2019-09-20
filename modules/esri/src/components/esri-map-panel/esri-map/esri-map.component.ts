import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Input, OnInit, Output, ViewChild } from '@angular/core';
import { debounce, debounceTime, filter, map, pairwise, startWith, take, withLatestFrom } from 'rxjs/operators';
import { EsriMapService } from '../../../services/esri-map.service';
import { AppState, selectors } from '../../../state/esri.selectors';
import { select, Store } from '@ngrx/store';
import { InitializeMap } from '../../../state/map/esri.map.actions';
import { EsriUtils, WatchResult } from '../../../core/esri-utils';
import { combineLatest } from 'rxjs';

@Component({
  selector: 'val-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapComponent implements OnInit {
  @Input() height: number;
  @Input() cursor: string;
  @Input() baseMap: string;
  @Input() manuallyResizable: boolean = true;

  @Output() mapClicked = new EventEmitter<__esri.MapViewImmediateClickEvent>();
  @Output() viewChanged = new EventEmitter<__esri.MapView>();

  @ViewChild('mapViewNode', { static: true }) private mapViewEl: ElementRef;

  constructor(private mapService: EsriMapService,
              private store: Store<AppState>) { }

  public ngOnInit() {
    this.store.dispatch(new InitializeMap({ domContainer: this.mapViewEl, baseMap: this.baseMap }));
    this.store.pipe(
      select(selectors.getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      this.viewChanged.emit(this.mapService.mapView); // one startup firing to get the initial viewpoint
      EsriUtils.handleMapViewEvent(this.mapService.mapView, 'immediate-click')
        .subscribe(e => this.mapClicked.emit(e));
      const center$ = EsriUtils.setupWatch(this.mapService.mapView, 'center').pipe(
        filter(result => this.compareCenters(result.newValue, result.oldValue))
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
      ).subscribe(() => this.viewChanged.emit(this.mapService.mapView));

      this.mapService.mapView.map.allLayers.forEach(layer => EsriUtils.setupWatch(layer, 'visible').subscribe(result => {
        this.viewChanged.emit(this.mapService.mapView);
      }));
    });
  }

  private compareCenters(current: __esri.Point, previous: __esri.Point) {
    return previous == null || current.x !== previous.x || current.y !== previous.y;
  }
}
