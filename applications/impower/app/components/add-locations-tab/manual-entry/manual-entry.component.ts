import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { FormConfig } from '@val/common';
import { AppEditSiteService } from 'app/services/app-editsite.service';
import { MenuItem, PrimeIcons } from 'primeng/api';
import { ValGeocodingRequest } from '../../../models/val-geocoding-request.model';
import { FullAppState } from '../../../state/app.interfaces';
import { resetNamedForm, updateNamedForm } from '../../../state/forms/forms.actions';
import { AddLocationForm } from '../../../state/forms/forms.interfaces';
import * as Presets from './manual-entry-presets';

@Component({
  selector: 'val-manual-entry',
  templateUrl: './manual-entry.component.html',
  styleUrls: ['./manual-entry.component.scss'],
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
              private appEditSiteService: AppEditSiteService,
              private store$: Store<FullAppState>) {}

  ngOnInit() {
    const formSetup: FormConfig<AddLocationForm> = {
      number: ['', Validators.required],
      name: '',
      street: '',
      city: '',
      state: '',
      zip: '',
      Market: '',
      coord: ['', this.appEditSiteService.latLonValidator()]
    };
    this.manualEntryForm = this.fb.group(formSetup, { updateOn: 'blur' });
    this.loadItems = [
      { label: 'VPW', icon: PrimeIcons.MAP_MARKER, command: () => this.loadVPW() },
      { label: 'Sky Zone', icon: PrimeIcons.MAP_MARKER, command: () => this.loadData(Presets.SkyZone) },
      { label: 'Tecumseh', icon: PrimeIcons.MAP_MARKER, command: () => this.loadData(Presets.Tecumseh), title: 'Use 20 mile TA to get geos from all owner group types' },
      { label: 'Madison', icon: PrimeIcons.MAP_MARKER, command: () => this.loadData(Presets.Madison), title: 'Has duplicate location attributes' },
      { label: `Nancy's`, icon: PrimeIcons.MAP_MARKER, command: () => this.loadData(Presets.Nancy), title: 'Close to VPW, for testing overlapping radii' },
      { label: `Erin's`, icon: PrimeIcons.MAP_MARKER, command: () => this.loadData(Presets.Erin), title: 'Very close to VPW, for testing overlapping radii' }
    ];
  }

  clear() : void {
    this.store$.dispatch(resetNamedForm({ path: 'addLocation' }));
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.manualEntryForm.get(controlKey);
    return (control.dirty || control.touched) && (control.errors != null);
  }

  onSubmit(formData: any) {
    if (formData.coord != null && formData.coord !== '') {
      formData.latitude = formData.coord.split(',')[0];
      formData.longitude = formData.coord.split(',')[1];
    } else {
      formData.latitude = '';
      formData.longitude = '';
    }
    delete formData.coord;
    this.submitSite.emit(new ValGeocodingRequest(formData));
  }

  loadVPW() {
    this.loadData(Presets.VPW);
  }

  private loadData(formData: AddLocationForm) {
    this.store$.dispatch(updateNamedForm({ path: 'addLocation', formData }));
  }

}
