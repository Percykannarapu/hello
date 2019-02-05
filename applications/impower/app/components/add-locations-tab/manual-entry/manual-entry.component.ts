import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/primeng';
import { ValGeocodingRequest } from '../../../models/val-geocoding-request.model';
import * as Presets from './manual-entry-presets';

@Component({
  selector: 'val-manual-entry',
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualEntryComponent implements OnInit {

  @Input() showLoadButtons: boolean;
  @Output() submitSite = new EventEmitter<ValGeocodingRequest>();

  manualEntryForm: FormGroup;
  loadItems: MenuItem[];

  get latitude() { return this.manualEntryForm.get('latitude'); }
  get longitude() { return this.manualEntryForm.get('longitude'); }

  constructor(private fb: FormBuilder) {}

  ngOnInit() {
    this.manualEntryForm = this.fb.group({
      number: ['', Validators.required],
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      Market: '',
      latitude: ['', this.latLonValidator(true)],
      longitude: ['', this.latLonValidator(false)]
    });
    this.loadItems = [
      { label: 'VPW', icon: 'ui-icon-map', command: () => this.loadVPW() },
      { label: 'Sky Zone', icon: 'ui-icon-map', command: () => this.loadData(Presets.SkyZone) },
      { label: 'Tecumseh', icon: 'ui-icon-map', command: () => this.loadData(Presets.Tecumseh), title: 'Use 20 mile TA to get geos from all owner group types' },
      { label: 'Madison', icon: 'ui-icon-map', command: () => this.loadData(Presets.Madison), title: 'Has duplicate location attributes' },
      { label: "Nancy's", icon: 'ui-icon-map', command: () => this.loadData(Presets.Nancys), title: 'Close to VPW, for testing overlaping radiuses' },
      { label: "Erin's", icon: 'ui-icon-map', command: () => this.loadData(Presets.Erins), title: 'Very close to VPW, for testing overlaping radiuses' }
    ];
  }

  clear() : void {
    this.manualEntryForm.reset();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.manualEntryForm.get(controlKey);
    return (control.dirty || control.touched) && (control.errors != null);
  }

  onSubmit(formData: any) {
    this.submitSite.emit(new ValGeocodingRequest(formData));
  }

  loadVPW() {
    this.loadData(Presets.VPW);
  }

  private loadData(data: any) {
    this.manualEntryForm.reset();
    this.manualEntryForm.patchValue(data);
  }

  private latLonValidator(isLat: boolean) : ValidatorFn {
    return (c: AbstractControl) => {
      if (c.value == null || c.value === '') return null; // empty is ok
      const numVal = Number(c.value);
      if (Number.isNaN(numVal)) {
        return {
          latLon: 'Value must be numeric'
        };
      } else {
        if (isLat && (numVal < -90 || numVal > 90)) {
          return {
            latLon: 'Latitude is limited to +/- 90'
          };
        }
        return null;
      }
    };
  }
}
