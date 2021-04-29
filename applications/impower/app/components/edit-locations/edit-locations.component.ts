import { ChangeDetectorRef, Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { AbstractControl, AsyncValidatorFn, FormBuilder, FormControl, FormGroup, ValidatorFn, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { AnyFn } from '@ngrx/store/src/selector';
import { AppLocationService } from 'app/services/app-location.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import { MenuItem } from 'primeng/api';
import { Observable, of, timer } from 'rxjs';
import { map, switchMap, tap } from 'rxjs/operators';
import { ValGeocodingRequest } from '../../models/val-geocoding-request.model';
import { AppEditSiteService } from '../../services/app-editsite.service';
import { AppStateService } from '../../services/app-state.service';
import { UsageService } from '../../services/usage.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';

const numberOrNull = (value: any) => value == null || value === '' || Number.isNaN(Number(value)) ? null : Number(value);

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

  /* Removed until ready
  get radius1() { return this.editLocationsForm.get('radius1'); }

  get radius2() { return this.editLocationsForm.get('radius2'); }

  get radius3() { return this.editLocationsForm.get('radius3'); }*/

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
/* Removed until ready
      [1, 2, 3].forEach(val => {
        if (this.displayData[`radius${val}`] === undefined || this.displayData[`radius${val}`] === ''){
          this.editLocationsForm.get(`radius${val}`).disable();
        } else {
          this.editLocationsForm.get(`radius${val}`).enable();
        }
      });*/
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
      homeZip: new FormControl('',  {  asyncValidators: this.validateGeo('CL_ZIPTAB14', 'geocode, ZIP, DMA, DMA_Name, COUNTY', 'Not a valid Home ZIP')}),
      homeAtz: new FormControl('',  {  asyncValidators: this.validateGeo('CL_ATZTAB14', 'geocode,ZIP', 'Not a valid Home ATZ')}),
      homeDigitalAtz: new FormControl('',  {  asyncValidators: this.validateGeo('VAL_DIGTAB14', 'geocode, ZIP, ZIP_ATZ', 'Not a valid Home DTZ')}),
      homePcr: new FormControl('',  {  asyncValidators: this.validateGeo('CL_PCRTAB14', 'geocode,ZIP, ZIP_ATZ, DMA, DMA_Name, COUNTY', 'Not a valid Home PCR')}),
/* Removed until ready
      radius1: [null, this.isInRange(0, 100)],
      radius2: [null, this.isInRange(0, 100)],
      radius3: [null, this.isInRange(0, 100)],*/
    }, /* Removed until ready {validators: this.isValidRadius} */);
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
      const value: string = c.value != null ? c.value.toUpperCase() : null;
      const reqPayload = {'tableName': tablename, 'fieldNames': fieldNames, 'geocodeList': [value] };

       if (c.pristine || c.value == null || c.value === '')
            return of(null);

       return timer(60).pipe(
         switchMap(() => this.appLocationService.getHomegeocodeData(reqPayload, 'v1/targeting/base/homegeo/homegeocode').
          pipe(map(response => {
                if (response.payload.length == 0){
                  return {homeGeoValid: errorMsg};
                }
                else return null;
              }), tap(() => this.cd.markForCheck())
          )
         )
       );
    };
  }

  private isInRange(minValue: number, maxValue: number) : ValidatorFn {
    return function(control: AbstractControl) {
      const currentRadius = numberOrNull(control.value);
      if (control.value != null && control.value !== '' && (currentRadius <= minValue || currentRadius > maxValue || Number.isNaN(Number(control.value)))) {
        return  {
          errorMsg: `You must enter a numeric value > ${minValue} and <= ${maxValue} for trade areas you want to apply.`
        };
      }
      return null;
    };
  }

  private isValidRadius(group: FormGroup) {
    const radius1 = group.controls[`radius1`];
    const radius2 = group.controls[`radius2`];
    const radius3 = group.controls[`radius3`];

    if (radius1.dirty && radius1.value >= radius2.value){
      group.controls[`radius1`].setErrors({
        errorMsg : `Value must be less than Trade Area 2`
      });
    }

    if (radius2.dirty && radius1.value >= radius2.value){
      group.controls[`radius2`].setErrors({
        errorMsg : `Value must be greater than Trade Area 1`
      });
    }

    if (radius3.dirty && radius2.value >= radius3.value) {
      group.controls[`radius3`].setErrors({
        errorMsg: `Value must be greater than Trade Area 2`
      });
    }

    if (radius3.dirty && radius2.dirty && radius1.value >= radius3.value) {
      group.controls[`radius3`].setErrors({
        errorMsg: `Value must be greater than Trade Area 1 & Trade Area 2`
      });
    }
    return null;
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
      'Home Carrier Route': data.homePcr /* Removed until ready,
      RADIUS1: data.radius1,
      RADIUS2: data.radius2,
      RADIUS3: data.radius3 */
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
    // this.editLocationsForm['controls']['coord'].setValue('');
  }

}
