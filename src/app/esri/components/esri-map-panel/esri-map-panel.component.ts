import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { EsriApi } from '../../core/esri-api.service';
import { EsriSketchViewWrapper } from '../../core/esri-sketch-view-wrapper';
import { EsriUtils } from '../../core/esri-utils';
import { EsriGraphicTypeCodes, MapStateTypeCodes } from '../../core/esri.enums';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriMapService } from '../../services/esri-map.service';
import { EsriQueryService } from '../../services/esri-query.service';

@Component({
  selector: 'val-esri-map-panel',
  templateUrl: './esri-map-panel.component.html',
  styleUrls: ['./esri-map-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapPanelComponent implements OnInit {
  private stateCursorMap: Map<MapStateTypeCodes, string>;
  private sketchViewWrapper: EsriSketchViewWrapper;
  private currentMapView: __esri.MapView;

  currentMapState = new BehaviorSubject<MapStateTypeCodes>(MapStateTypeCodes.Popups);
  cursor$: Observable<string>;
  MapStateTypeCodes = MapStateTypeCodes;

  @Input() mapHeight: number;

  @Output() polySelected = new EventEmitter<__esri.Graphic[]>();
  @Output() viewChanged = new EventEmitter<__esri.MapView>();
  @Output() mapReady = new EventEmitter<__esri.MapView>();

  constructor(private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService) { }

  ngOnInit() {
    console.log('Initializing Esri Map Panel Component');
    this.currentMapState.subscribe(newState => this.handleMapStateChange(newState));
    this.stateCursorMap = new Map<MapStateTypeCodes, string>([
      [MapStateTypeCodes.SelectPoly, 'copy'],
      [MapStateTypeCodes.DrawPoint, 'cell'],
      [MapStateTypeCodes.MeasureLine, 'crosshair'],
      [MapStateTypeCodes.DrawLine, 'crosshair'],
      [MapStateTypeCodes.DrawPoly, 'crosshair'],
    ]);
    this.cursor$ = this.currentMapState.pipe(
      map(state => this.stateCursorMap.has(state) ? this.stateCursorMap.get(state) : 'default')
    );
  }

  onMapClick(location:  __esri.MapViewImmediateClickEvent) : void {
    if (this.currentMapState.getValue() === MapStateTypeCodes.SelectPoly) {
      this.currentMapView.hitTest(location).then(response => {
        this.polySelected.emit(response.results.map(r => r.graphic));
      }, err => console.error('Error during click event handling', err));
    }
  }

  onViewChanged(mapView: __esri.MapView) : void {
    this.viewChanged.emit(mapView);
  }

  onViewCreated(mapView: __esri.MapView) : void {
    this.mapService.mapView = mapView;
    this.currentMapView = mapView;
    this.mapReady.emit(mapView);
  }

  private initSketchView() : void {
    if (this.sketchViewWrapper == null) this.sketchViewWrapper = new EsriSketchViewWrapper(this.currentMapView);
    this.sketchViewWrapper.reset();
  }

  private handleMapStateChange(newMapState: MapStateTypeCodes) : void {
    switch (newMapState) {
      case MapStateTypeCodes.DrawPoly:
        this.layerService.setAllPopupStates(false);
        this.initSketchView();
        this.sketchViewWrapper.draw(EsriGraphicTypeCodes.Rectangle)
          .subscribe(geometry => this.selectFeaturesInExtent(geometry as __esri.Polygon));
        break;
      case MapStateTypeCodes.MeasureLine:
        this.layerService.setAllPopupStates(false);
        this.initSketchView();
        this.sketchViewWrapper.draw(EsriGraphicTypeCodes.Polyline)
          .subscribe(geometry => this.measurePolyLine(geometry as __esri.Polyline));
        break;
      case MapStateTypeCodes.Popups:
        this.layerService.setAllPopupStates(true);
        break;
      case MapStateTypeCodes.RemoveGraphics:
        this.mapService.mapView.graphics.removeAll();
        setTimeout(() => this.currentMapState.next(MapStateTypeCodes.Popups), 0);
        break;
      case MapStateTypeCodes.SelectPoly:
        this.layerService.setAllPopupStates(false);
        break;
      default:
        break;
    }
  }

  private selectFeaturesInExtent(geometry: __esri.Polygon) : void {
    const graphicsList = [];
    const layers = this.mapService.mapView.map.allLayers.filter(l => EsriUtils.layerIsFeature(l) && l.visible).toArray() as __esri.FeatureLayer[];
    if (layers.length === 0) return;
    this.queryService.queryLayerView(layers, geometry.extent).subscribe(
      graphics => graphicsList.push(...graphics),
      err => console.error('There was an error querying the layer views', err),
      () => {
        this.polySelected.emit(graphicsList);
        this.mapService.mapView.graphics.removeAll();
        setTimeout(() => this.currentMapState.next(MapStateTypeCodes.Popups), 0);
      });
  }

  private measurePolyLine(polyline: __esri.Polyline) {
    const length: number = EsriApi.geometryEngine.geodesicLength(polyline, 'miles');
    const textSymbol = {
      type: 'text',
      color: 'black',
      text: `${length.toFixed(4)} miles`,
      xoffset: 50,
      yoffset: 3,
      font: { // auto casts as Font
        size: 10,
        weight: 'bold',
        family: 'sans-serif'
      }
    };
    const graphic = new EsriApi.Graphic({
      geometry: polyline.getPoint(0, 0),
      symbol: textSymbol
    });
    this.mapService.mapView.graphics.add(graphic);
  }
}
