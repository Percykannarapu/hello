import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { select, Store } from '@ngrx/store';
import { AppState, internalSelectors } from '../../state/esri.selectors';
import { MeasureDistanceSelected, PopupButtonSelected, SelectMultiPolySelected, SelectSinglePolySelected, UnselectMultiPolySelected, XYButtonSelected } from '../../state/map/esri.map-button.actions';
import { buttonToCursorMap, SelectedButtonTypeCodes } from '../../core/esri.enums';
import { MapClicked, SetMapHeight, SetMapViewpoint } from '../../state/map/esri.map.actions';

@Component({
  selector: 'val-esri-map-panel',
  templateUrl: './esri-map-panel.component.html',
  styleUrls: ['./esri-map-panel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class EsriMapPanelComponent {
  currentMapState$: Observable<SelectedButtonTypeCodes> = this.store.pipe(select(internalSelectors.getEsriMapButtonState));
  height$: Observable<number> = this.store.pipe(select(internalSelectors.getEsriMapHeight));
  cursor$: Observable<string> = this.currentMapState$.pipe(map(state => buttonToCursorMap[state]));
  SelectedButtonTypeCodes = SelectedButtonTypeCodes;

  @Input() showSelectionButtons: boolean = true;
  @Input() showLabelConfigButton: boolean = true;
  @Input() set mapHeight(val: number) {
    this.store.dispatch(new SetMapHeight({ newMapHeight: val }));
  }
  @Input() baseMap: string;

  @Output() viewChanged = new EventEmitter<__esri.MapView>();
  @Output() selectedButton = new EventEmitter();

  constructor(private store: Store<AppState>) { }

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
      case SelectedButtonTypeCodes.XY:
        this.store.dispatch(new XYButtonSelected());
        break;
      default:
        throw new Error('Unknown Button type selected');
    }
    this.selectedButton.emit(newButton);
  }
}
