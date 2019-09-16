import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { ValGeocodingRequest } from '../../../models/val-geocoding-request.model';
import * as Presets from './manual-entry-presets';
import { AppEditSiteService } from 'app/services/app-editsite.service';

@Component({
  selector: 'val-manual-entry',
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ManualEntryComponent implements OnInit {

  @Input() showLoadButtons: boolean;
  @Output() submitSite = new EventEmitter<ValGeocodingRequest>();

  manualEntryForm: FormGroup;
  loadItems: MenuItem[];

  get latitude() { return this.manualEntryForm.get('latitude'); }
  get longitude() { return this.manualEntryForm.get('longitude'); }
  get coord() { return this.manualEntryForm.get('coord'); }

  constructor(private fb: FormBuilder,
              private appEditSiteService: AppEditSiteService) {}

  ngOnInit() {
    this.manualEntryForm = this.fb.group({
      number: ['', Validators.required],
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      Market: '',
      coord: ['', this.appEditSiteService.latLonValidator()]
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
    if (formData.coord != null && formData.coord != undefined && formData.coord != '') {
      formData.latitude = formData.coord.split(',')[0];
      formData.longitude = formData.coord.split(',')[1];
    } else if (formData.coord == '') {
      formData.latitude = '';
      formData.longitude = '';
    }
    delete formData.coord;
    this.submitSite.emit(new ValGeocodingRequest(formData));
  }

  loadVPW() {
    this.loadData(Presets.VPW);
  }

  private loadData(data: any) {
    this.manualEntryForm.reset();
    this.manualEntryForm.patchValue(data);
  }

}
