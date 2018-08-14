import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { AbstractControl, FormBuilder, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/primeng';
import { ValGeocodingRequest } from '../../../models/val-geocoding-request.model';
import * as Presets from './manual-entry-presets';
import { AppStateService } from '../../../services/app-state.service';

@Component({
  selector: 'val-manual-entry',
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.css']
})
export class ManualEntryComponent implements OnInit {

  @Input() showLoadButtons: boolean;
  @Output() submitSite = new EventEmitter<ValGeocodingRequest>();

  manualEntryForm: FormGroup;
  loadItems: MenuItem[];

  constructor(private fb: FormBuilder,
              private appStateService: AppStateService) {
                this.appStateService.getClearUserInterfaceObs().subscribe(flag => this.clearFields(flag)); 

  }

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
      { label: 'Madison', icon: 'ui-icon-map', command: () => this.loadData(Presets.Madison), title: 'Has duplicate location attributes' }
    ];
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

  public clearFields(flag: boolean){
    if (flag){
        this.manualEntryForm.reset();
    }

  }
}
