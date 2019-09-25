import { Component, OnInit, Input, OnChanges, SimpleChanges, Output, EventEmitter, ChangeDetectorRef } from '@angular/core';
import { MenuItem } from 'primeng/api';
import { FormBuilder, FormGroup, Validators, ValidatorFn, AbstractControl, AsyncValidatorFn, ValidationErrors, FormControl } from '@angular/forms';
import { AnyFn } from '@ngrx/store/src/selector';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';
import { AppEditSiteService } from '../../services/app-editsite.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { Store, select } from '@ngrx/store';
import { Observable, of } from 'rxjs';
import { map, switchMap, debounceTime, tap, reduce, mergeMap } from 'rxjs/operators';
import { AppLocationService } from 'app/services/app-location.service';
import { ImpGeofootprintLocation } from 'app/val-modules/targeting/models/ImpGeofootprintLocation';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';

@Component({
  selector: 'val-edit-locations',
  templateUrl: './edit-locations.component.html',
  styleUrls: ['./edit-locations.component.scss']
})
export class EditLocationsComponent implements OnInit, OnChanges {

  @Input() displayData: AnyFn;
  @Output() closeDialog = new EventEmitter();
  @Output() submitSite = new EventEmitter();

  @Input() oldData: any;
  
  loadItems: MenuItem[];

  editLocationsForm: FormGroup;
  
  get coord() { return this.editLocationsForm.get('coord'); }

  constructor(private fb: FormBuilder,
              private appStateService: AppStateService,
              private appEditSiteService: AppEditSiteService,
              private store$: Store<LocalAppState>,
              private appLocationService: AppLocationService,
              private restService: RestDataService,
              private cd: ChangeDetectorRef,
              private usageService: UsageService) { }
  ngOnChanges(change: SimpleChanges) {
    if  (this.displayData) {
      this.editLocationsForm.reset();
      this.editLocationsForm.patchValue(this.displayData);
    }
  }
  ngOnInit() {
    this.editLocationsForm = this.fb.group({
      locationNumber: ['', Validators.required],
      locationName: '',
      locAddress: '',
      locCity: '',
      locState: '',
      locZip: '',
      marketName: '',
      marketCode: '',
      coord: ['', this.appEditSiteService.latLonValidator()],
      homeZip: new FormControl('',  { updateOn: 'blur', asyncValidators: this.validateGeo('CL_ZIPTAB14', 'geocode, ZIP, DMA, DMA_Name, COUNTY', 'Not a valid Home ZIP')}),
      homeAtz: new FormControl('',  { updateOn: 'blur', asyncValidators: this.validateGeo('CL_ATZTAB14', 'geocode,ZIP', 'Not a valid Home ATZ')}),
      homeDigitalAtz: new FormControl('',  { updateOn: 'blur', asyncValidators: this.validateGeo('VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ', 'Not a valid Home DTZ')}),
      homePcr: new FormControl('',  { updateOn: 'blur', asyncValidators: this.validateGeo('CL_PCRTAB14', 'geocode,ZIP, ZIP_ATZ, DMA, DMA_Name, COUNTY', 'Not a valid Home PCR')}),
    });
    this.appStateService.clearUI$.subscribe(() => this.editLocationsForm.reset());
  }

  cancelDialog() {
    this.editLocationsForm.reset();
    this.closeDialog.emit();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.editLocationsForm.get(controlKey);
    return (control.dirty || control.touched) && (control.errors != null);
  }

  validateGeo(tablename: string, fieldNames: string, errorMsg: string) : AsyncValidatorFn  {
    return (c: AbstractControl) : Promise<{[key: string] : any} | null> | Observable<{[key: string] : any} | null> => {
      //const tablename = 'CL_ZIPTAB14';
      const reqPayload = {'tableName': tablename, 'fieldNames': fieldNames, 'geocodeList': [c.value] };
      

      return this.appLocationService.getHomegeocodeData(reqPayload, 'v1/targeting/base/homegeo/homegeocode').
              pipe(map(response => {
                  if (response.payload.length == 0){
                    return {homeGeoValid: errorMsg};
                  }
                  else return null;
              }),
              tap(() => this.cd.markForCheck()));
    };
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
      longitude: data.coord.split(',')[1],
      'Home Zip Code': data.homeZip,
      'Home ATZ': data.homeAtz,
      'Home Digital ATZ': data.homeDigitalAtz,
      'Home Carrier Route': data.homePcr
    };
    this.submitSite.emit(new ValGeocodingRequest(formData));
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'single-site', action: 'add' });
    const mktValue = formData.Market != null ? `~Market=${formData.Market}` : null;
    let metricsText = `Number=${formData.number}~Name=${formData.name}~Street=${formData.street}~City=${formData.city}~State=${formData.state}~ZIP=${formData.zip}`;
    metricsText = mktValue != null ? metricsText + mktValue : metricsText;
    this.usageService.createCounterMetric(usageMetricName, metricsText, null);
    this.cancelDialog();
  }
  
  public formEdited() : void {
    this.editLocationsForm['controls']['coord'].setValue('');
}

}