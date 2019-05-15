import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { FullState } from '../../state';
import { select, Store } from '@ngrx/store';
import { PopupGeoToggle } from '../../state/shared/shared.actions';
import { localSelectors } from '../../state/app.selectors';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export interface FieldMetaData {
  fieldType: 'string' | 'numeric' | 'percent';
  fieldLabel: string;
  fieldName: string;
}

type MapView = import('esri/views/MapView');
type Feature = import ('esri/widgets/Feature');

@Component({
  selector: 'cpq-map-popup',
  templateUrl: './map-popup.component.html',
  styleUrls: ['./map-popup.component.css']
})
export class MapPopupComponent implements OnInit, OnDestroy {

  checkingAvailability: boolean = true;
  isAvailable: boolean = false;
  @Input() selectedFeature: Feature;
  @Input() fields: FieldMetaData[];
  @Input() mapView: MapView;

  @Output() closePopup = new EventEmitter<void>();

  get selectedAttributes() : Record<string, any> {
    return this.selectedFeature.graphic.attributes;
  }

  get filteredFields() : FieldMetaData[] {
    return this.fields.filter(f => this.selectedAttributes[f.fieldName] != null);
  }

  private destroyed$ = new Subject<void>();

  constructor(private store$: Store<FullState>,
              private cd: ChangeDetectorRef) { }

  ngOnInit() {
    setTimeout(() => {
      this.checkingAvailability = false;
      this.isAvailable = true;
      this.cd.detectChanges();
    }, 2000);
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  onClick() {
    this.store$.dispatch(new PopupGeoToggle({ eventName: 'toggle-selection' }));
    this.closePopup.emit();
  }
}
