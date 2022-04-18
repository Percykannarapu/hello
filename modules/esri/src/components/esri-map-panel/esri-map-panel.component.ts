import { ChangeDetectionStrategy, Component, EventEmitter, HostListener, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { MapViewImmediateClickEvent } from '../../core/esri-event-shims';
import { esriZoomLocalStorageKey } from '../../configuration';
import { buttonToCursorMap, SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriMapService } from '../../services/esri-map.service';
import { EsriShadingService } from '../../services/esri-shading.service';
import { AppState } from '../../state/esri.reducers';
import { internalSelectors } from '../../state/esri.selectors';
import {
  MeasureDistanceSelected,
  PopupButtonSelected,
  SelectMultiPolySelected,
  SelectSinglePolySelected,
  UnselectMultiPolySelected,
  XYButtonSelected
} from '../../state/map/esri.map-button.actions';
import { MapClicked, SetMapHeight, SetMapViewpoint } from '../../state/map/esri.map.actions';

@Component({
  selector: 'val-esri-map-panel',
  templateUrl: './esri-map-panel.component.html',
  styleUrls: ['./esri-map-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapPanelComponent implements OnInit {
  currentMapState$: Observable<SelectedButtonTypeCodes> = this.store.select(internalSelectors.getEsriMapButtonState);
  height$: Observable<number> = this.store.select(internalSelectors.getEsriMapHeight);
  cursor$: Observable<string> = this.currentMapState$.pipe(map(state => buttonToCursorMap[state]));

  @Input() toolbarButtons: SelectedButtonTypeCodes[] = [SelectedButtonTypeCodes.ShowPopups];
  @Input() defaultToolbarButton: SelectedButtonTypeCodes = SelectedButtonTypeCodes.ShowPopups;

  @Input() showLabelConfigButton: boolean = true;
  @Input() set mapHeight(val: number) {
    this.store.dispatch(new SetMapHeight({ newMapHeight: val }));
  }
  @Input() baseMap: string;
  @Input() showAlternateZoomChoice = false;

  @Output() viewChanged = new EventEmitter<__esri.MapView>();
  @Output() selectedButton = new EventEmitter<SelectedButtonTypeCodes>();

  private useAlternateZoom = false;

  constructor(private store: Store<AppState>,
              private mapService: EsriMapService,
              private shadingService: EsriShadingService) {}

  @HostListener('window:keydown', ['$event'])
  keyDownEvent(event: KeyboardEvent) {
    if (event.defaultPrevented || !this.useAlternateZoom) return;
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.mapService.setMousewheelNavigation(true);
        break;
    }
  }

  @HostListener('window:keyup', ['$event'])
  keyUpEvent(event: KeyboardEvent) {
    if (event.defaultPrevented || !this.useAlternateZoom) return;
    switch (event.code) {
      case 'ShiftLeft':
      case 'ShiftRight':
        this.mapService.setMousewheelNavigation(false);
        break;
    }
  }

  ngOnInit() : void {
    this.shadingService.initializeShadingWatchers();
    this.useAlternateZoom = JSON.parse(localStorage.getItem(esriZoomLocalStorageKey)) || false;
  }

  onMapClick(location:  MapViewImmediateClickEvent) : void {
    this.store.dispatch(new MapClicked({ event: { ...location } }));
  }

  onViewChanged(mapView: __esri.MapView) : void {
    this.store.dispatch(new SetMapViewpoint({ newViewpointJson: mapView.viewpoint.toJSON() }));
    this.viewChanged.emit(mapView);
  }

  onButtonSelected(newButton: SelectedButtonTypeCodes) : void {
    switch (newButton) {
      case SelectedButtonTypeCodes.ShowPopups:
        this.store.dispatch(new PopupButtonSelected());
        break;
      case SelectedButtonTypeCodes.SelectSinglePoly:
        this.store.dispatch(new SelectSinglePolySelected());
        break;
      case SelectedButtonTypeCodes.MeasureDistance:
        this.store.dispatch(new MeasureDistanceSelected());
        break;
      case SelectedButtonTypeCodes.SelectMultiplePolys:
        this.store.dispatch(new SelectMultiPolySelected());
        break;
      case SelectedButtonTypeCodes.UnselectMultiplePolys:
        this.store.dispatch(new UnselectMultiPolySelected());
        break;
      case SelectedButtonTypeCodes.XY:
        this.store.dispatch(new XYButtonSelected());
        break;
      default:
        throw new Error('Unknown Button type selected');
    }
    this.selectedButton.emit(newButton);
  }

  onZoomChanged(value: boolean) {
    this.useAlternateZoom = value;
    this.mapService.setMousewheelNavigation(!value);
  }
}
