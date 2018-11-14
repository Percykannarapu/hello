import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { filter, take, withLatestFrom } from 'rxjs/operators';
import { EsriAppSettingsConfig, EsriAppSettingsToken } from '../../../configuration';
import { EsriUtils, WatchResult } from '../../../core/esri-utils';
import { EsriMapService } from '../../../services/esri-map.service';
import { AppState, EsriState, getMapReady } from '../../../state/esri.selectors';
import { select, Store } from '@ngrx/store';
import { InitializeMap } from '../../../state/map/esri.map.actions';
import { getEsriViewpointState } from '../../../state/esri.selectors';

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

  @Output() mapClicked = new EventEmitter<__esri.MapViewImmediateClickEvent>();
  @Output() viewChanged = new EventEmitter<__esri.MapView>();

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private mapService: EsriMapService,
              private store: Store<AppState>,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettingsConfig) { }

  public ngOnInit() {
    this.store.dispatch(new InitializeMap({ domContainer: this.mapViewEl, baseMap: this.baseMap }));
    this.store.pipe(
      select(getMapReady),
      filter(ready => ready),
      take(1)
    ).subscribe(() => {
      EsriUtils.handleMapViewEvent(this.mapService.mapView, 'immediate-click')
        .subscribe(e => this.mapClicked.emit(e));
      EsriUtils.setupWatch(this.mapService.mapView, 'updating')
      .pipe(
        filter(result => !result.newValue),
        withLatestFrom(this.store.pipe(select(getEsriViewpointState))),
        filter(([result, viewpoint]) => this.compareViewpoints(result, viewpoint))
      ).subscribe(result => this.viewChanged.emit(result[0].target));
    });
  }

  private compareViewpoints(result: WatchResult<__esri.MapView, 'updating'>, viewpoint: __esri.Viewpoint) : boolean {
    let updated: boolean = false;
    if (viewpoint == null) return true; //viewpoint will be null at startup
    const resultGeom: __esri.Point = <__esri.Point> result.target.viewpoint.targetGeometry;
    const viewpointGeom: __esri.Point = <__esri.Point> viewpoint.targetGeometry;
    if (result.target.viewpoint.scale != viewpoint.scale) updated = true;
    if (resultGeom.x != viewpointGeom.x) updated = true;
    if (resultGeom.y != viewpointGeom.y) updated = true;
    return updated;
  }
}
