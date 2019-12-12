import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { Store } from '@ngrx/store';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { buttonToCursorMap, SelectedButtonTypeCodes } from '../../core/esri.enums';
import { EsriShadingLayersService } from '../../services/esri-shading-layers.service';
import { AppState, internalSelectors } from '../../state/esri.selectors';
import { MeasureDistanceSelected, PopupButtonSelected, SelectMultiPolySelected, SelectSinglePolySelected, UnselectMultiPolySelected, XYButtonSelected } from '../../state/map/esri.map-button.actions';
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
  SelectedButtonTypeCodes = SelectedButtonTypeCodes;

  @Input() showSelectionButtons: boolean = true;
  @Input() showLabelConfigButton: boolean = true;
  @Input() set mapHeight(val: number) {
    this.store.dispatch(new SetMapHeight({ newMapHeight: val }));
  }
  @Input() baseMap: string;

  @Output() viewChanged = new EventEmitter<__esri.MapView>();
  @Output() selectedButton = new EventEmitter();

  constructor(private store: Store<AppState>,
              private shadingService: EsriShadingLayersService) {}

  ngOnInit() : void {
    this.shadingService.initializeShadingWatchers();
  }

  onMapClick(location:  __esri.MapViewImmediateClickEvent) : void {
    this.store.dispatch(new MapClicked({ event: { ...location } }));
  }

  onViewChanged(mapView: __esri.MapView) : void {
    this.store.dispatch(new SetMapViewpoint({ newViewpointJson: mapView.viewpoint.toJSON() }));
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
