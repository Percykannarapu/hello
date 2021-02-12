import { ChangeDetectorRef, Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { Action, Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { take } from 'rxjs/operators';
import { AvailabilityDetailResponse } from '../../models/availability-detail-response';
import { AppAvailabilityService, GeoStatus } from '../../services/app-availability.service';
import { FieldMetaData } from '../../services/config.service';
import { FullState } from '../../state';
import { PopupGeoToggle, PopupNewGeoAdd } from '../../state/popup/popup.actions';

@Component({
  selector: 'cpq-map-popup',
  templateUrl: './map-popup.component.html',
  styleUrls: ['./map-popup.component.css']
})
export class MapPopupComponent implements OnInit, OnDestroy {

  GeoStatus = GeoStatus; // necessary for the template to use an enum

  @Input() selectedFeature: __esri.Feature;
  @Input() fields: FieldMetaData[];
  @Input() mapView: __esri.MapView;

  @Output() closePopup = new EventEmitter<void>();

  hasError: boolean = false;
  checkingAvailability: boolean;
  isAvailable: boolean;
  status: GeoStatus;

  get selectedAttributes() : Record<string, any> {
    return this.selectedFeature.graphic.attributes;
  }

  get filteredFields() : FieldMetaData[] {
    return this.fields.filter(f => this.selectedAttributes[f.fieldName] != null);
  }

  private destroyed$ = new Subject<void>();
  private availsResult: AvailabilityDetailResponse[];

  constructor(private availsService: AppAvailabilityService,
              private store$: Store<FullState>,
              private cd: ChangeDetectorRef) { }

  ngOnInit() {
    const geocode = this.selectedAttributes['geocode'];
    this.availsService.getStatus(geocode).pipe(
      take(1)
    ).subscribe(status => {
      this.status = status;
      if (status === GeoStatus.AvailabilityCheckRequired) {
        this.checkingAvailability = true;
        this.availsService.isAvailable(geocode, this.selectedAttributes['wrap_name']).pipe(
          take(1)
        ).subscribe(results => {
          this.checkingAvailability = false;
          this.isAvailable = results.length > 0 && results.every(r => r.isAvailable === 1);
          this.availsResult = results;
          this.cd.detectChanges();
        }, err => {
          this.hasError = true;
          console.error('Error during Avails request', err);
          this.cd.detectChanges();
        });
      }
      this.cd.detectChanges();
    }, err => {
      this.hasError = true;
      console.error('Error during Status request', err);
      this.cd.detectChanges();
    });
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  onClick() {
    let action: Action;
    const geocode = this.selectedAttributes['geocode'];
    const wrapName = this.selectedAttributes['wrap_name'];
    switch (this.status) {
      case GeoStatus.Selected:
      case GeoStatus.Unselected:
        action = new PopupGeoToggle({ geocode, wrapName });
        break;
      case GeoStatus.AvailabilityCheckRequired:
        action = new PopupNewGeoAdd({ geocode, wrapName, availsInfo: this.availsResult });
        break;
    }
    this.store$.dispatch(action);
    this.closePopup.emit();
  }
}
