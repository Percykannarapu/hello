import { ChangeDetectionStrategy, Component, ElementRef, EventEmitter, Inject, Input, OnInit, Output, ViewChild } from '@angular/core';
import { filter } from 'rxjs/operators';
import { EsriAppSettingsConfig, EsriAppSettingsToken } from '../../../configuration';
import { EsriApi } from '../../../core/esri-api.service';
import { EsriUtils } from '../../../core/esri-utils';
import { EsriMapService } from '../../../services/esri-map.service';

@Component({
  selector: 'val-esri-map',
  templateUrl: './esri-map.component.html',
  styleUrls: ['./esri-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapComponent implements OnInit {
  @Input() height: number = 400;
  @Input() cursor: string;

  @Output() viewCreated = new EventEmitter<__esri.MapView>();
  @Output() mapClicked = new EventEmitter<__esri.MapViewImmediateClickEvent>();
  @Output() viewChanged = new EventEmitter<__esri.MapView>();

  @ViewChild('mapViewNode') private mapViewEl: ElementRef;

  constructor(private mapService: EsriMapService,
              @Inject(EsriAppSettingsToken) private config: EsriAppSettingsConfig) { }

  public ngOnInit() {
    console.log('Initializing Esri Map Component');
    const newMapParams = Object.assign({}, this.config.esriAppSettings.defaultMapParams);
    newMapParams.basemap = EsriApi.BaseMap.fromId('streets');
    const map = new EsriApi.Map(newMapParams);
    const newMapViewProps = Object.assign({}, this.config.esriAppSettings.defaultViewParams);
    newMapViewProps.container = this.mapViewEl.nativeElement;
    newMapViewProps.map = map;
    this.mapService.mapView = new EsriApi.MapView(newMapViewProps);
    this.mapService.mapView.when(() => {
      EsriUtils.handleMapViewEvent(this.mapService.mapView, 'immediate-click')
        .subscribe(e => this.mapClicked.emit(e));
      EsriUtils.setupWatch(this.mapService.mapView, 'updating')
        .pipe(filter(result => !result.newValue))
        .subscribe(result => this.viewChanged.emit(result.target));
      this.viewCreated.emit(this.mapService.mapView);
    });
  }

  private init() : void {
    // this.esriMapService.onReady$.pipe(
    //   filter(ready => ready),
    //   take(1)
    // ).subscribe(() => {
    //   this.mapView = this.mapDispatch.getMapView();
    //   this.appMapService.setupMap();
    //   this.mapDispatch.onMapViewClick().subscribe(event => this.clickHandler(event));
    //   this.mapDispatch.afterMapViewUpdate().subscribe(() => this.saveMapViewData(this.mapContainerEl));
    //   this.setMapHeight();
    //   this.setMapCenter();
    //   this.setMapZoom();
    //   this.setMapViewPoint();
    // });
  }
}
