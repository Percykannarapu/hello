import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { AnyFn } from '@ngrx/store/src/selector';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';

@Component({
  selector: 'val-edit-locations',
  templateUrl: './edit-locations.component.html',
  styleUrls: ['./edit-locations.component.css']
})
export class EditLocationsComponent implements OnInit, OnChanges {

  @Input() displayData: AnyFn;
  @Output() closeDialog = new EventEmitter();
  @Output() submitSite = new EventEmitter();

  @Input() oldData: any;
  
  loadItems: MenuItem[];

  editLocationsForm: FormGroup;

  get latitude() { return this.editLocationsForm.get('latitude'); }
  get longitude() { return this.editLocationsForm.get('longitude'); }

  constructor(private fb: FormBuilder,
              private appStateService: AppStateService,
              private usageService: UsageService) { }
  ngOnChanges(change: SimpleChanges) {
    if  (this.displayData) {
      this.editLocationsForm.reset();
      this.editLocationsForm.patchValue(this.displayData);
    }
  }
  ngOnInit() {
    this.editLocationsForm = this.fb.group({
      locationNumber: ['', this.alphaNumeric()],
      locationName: ['', this.alphaNumeric()],
      locAddress: ['', this.alphaNumeric()],
      locCity: ['', this.alphaNumeric()],
      locState: ['', this.alphaNumeric()],
      locZip: ['', this.onlyNumeric()],
      marketName: ['', this.alphaNumeric()],
      marketCode: ['', this.alphaNumeric()],
      coord: ['', this.latLonValidator()]
    });
    this.appStateService.clearUI$.subscribe(() => this.editLocationsForm.reset());
  }

  cancelDialog() {
    this.editLocationsForm.reset();
    this.closeDialog.emit();
  }

  onSubmit(data: any) {
    const formData = {
      name: data.locationName, 
      number: data.locationNumber, 
      Market: data.marketName, 
      'Market Code': data.marketCode, 
      street: data.locAddress, 
      city: data.locCity, 
      state: data.locState, 
      zip: data.locZip, 
      latitude: data.coord.split(',')[0], 
      longitude: data.coord.split(',')[1]
    };
    this.submitSite.emit(new ValGeocodingRequest(formData));
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'single-site', action: 'add' });
    const mktValue = formData.Market != null ? `~Market=${formData.Market}` : null;
    let metricsText = `Number=${formData.number}~Name=${formData.name}~Street=${formData.street}~City=${formData.city}~State=${formData.state}~ZIP=${formData.zip}`;
    metricsText = mktValue != null ? metricsText + mktValue : metricsText;
    this.usageService.createCounterMetric(usageMetricName, metricsText, null);
    this.cancelDialog();
  }

  private alphaNumeric() : ValidatorFn {
    return (c: AbstractControl) => {
      const enteredValue = c.value as string;
      const regex = /^[a-zA-Z0-9\s,-]*$/ ;  

      if (enteredValue && !regex.test(enteredValue)) {
        return {
          an: 'Should be Alphanumeric'
        };
      } else {
        return null;
      }
    };
  }

  private onlyNumeric() : ValidatorFn {
    return (c: AbstractControl) => {
      const enteredValue = c.value as string;
      const regex = /^[0-9-]*$/ ;
      if (enteredValue && !regex.test(enteredValue)) {
        return {
          an: 'Should be Numeric'
        };
      } else {
        return null;
      }
    };
  }

  private latLonValidator() : ValidatorFn {
    this.alphaNumeric();
    return (c: AbstractControl) => {
      const enteredValue = c.value as string;
      if (enteredValue == null || enteredValue.length === 0) {
        return null;
      }
      const coords = enteredValue.split(',');
      if (coords.length === 2) {
        const lat = coords[0] ? Number(coords[0]) : NaN;
        const lon = coords[1] ? Number(coords[1]) : NaN;
        if (!Number.isNaN(lat) && !Number.isNaN(lon)) {
          if ( lat < -90 || lat > 90 ) {
            return {
              latLon: 'Latitude is limited to +/- 90'
            };
          } 
          let latcount = 11, loncount = 8;
          if (lat.toString().indexOf('.') > -1) latcount++;
          if (lat.toString().indexOf('-') > -1) latcount++;
          if (lon.toString().indexOf('.') > -1) loncount++;
          if (lon.toString().indexOf('-') > -1) loncount++;

          if (lat.toString().length > latcount) {
            return {
              latLon: 'Maximum length of Latitude is 11'
            };
          }
          if (lon.toString().length > loncount) {
            return {
              latLon: 'Maximum length of Longitude is 8'
            };
          }
          return null;
        } else if (Number.isNaN(lat) || Number.isNaN(lon)) {
          return {
            latLon: 'Value must be numeric'
          };
        }
      } else if (coords.length != 2) {
        return {
          latLon: 'Should have 2 values'
        };
      }
    };
  }
}