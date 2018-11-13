import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buttonToCursorMap, SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriLayerService } from '../../services/esri-layer.service';
import { EsriMapService } from '../../services/esri-map.service';
import { EsriQueryService } from '../../services/esri-query.service';
import { select, Store } from '@ngrx/store';
import { AppState, getEsriMapButtonState, getEsriMapHeight } from '../../state/esri.selectors';
import { SetMapHeight } from '../../state';
import { MapClicked, SetMapViewpoint } from '../../state/map/esri.map.actions';
import { MeasureDistanceSelected, PopupButtonSelected, SelectMultiPolySelected, UnselectMultiPolySelected, SelectSinglePolySelected } from '../../state/map/esri.map-button.actions';

@Component({
  selector: 'val-esri-map-panel',
  templateUrl: './esri-map-panel.component.html',
  styleUrls: ['./esri-map-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapPanelComponent {
  currentMapState$: Observable<SelectedButtonTypeCodes> = this.store.pipe(select(getEsriMapButtonState));
  height$: Observable<number> = this.store.pipe(select(getEsriMapHeight));
  cursor$: Observable<string> = this.currentMapState$.pipe(map(state => buttonToCursorMap[state]));
  SelectedButtonTypeCodes = SelectedButtonTypeCodes;

  @Input() set mapHeight(val: number) {
    this.store.dispatch(new SetMapHeight({ newMapHeight: val }));
  }

  @Output() viewChanged = new EventEmitter<__esri.MapView>();
  @Output() selectedButton = new EventEmitter();

  constructor(private mapService: EsriMapService,
              private layerService: EsriLayerService,
              private queryService: EsriQueryService,
              private store: Store<AppState>) { }

  onMapClick(location:  __esri.MapViewImmediateClickEvent) : void {
    this.store.dispatch(new MapClicked({ event: location }));
  }

  onViewChanged(mapView: __esri.MapView) : void {
    this.store.dispatch(new SetMapViewpoint({ newViewpoint: mapView.viewpoint }));
    this.viewChanged.emit(mapView);
  }

  selectButton(newButton: SelectedButtonTypeCodes) : void {
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
      default:
        throw new Error('Unknown Button type selected');
    }
    this.selectedButton.emit(newButton);
  }
}
