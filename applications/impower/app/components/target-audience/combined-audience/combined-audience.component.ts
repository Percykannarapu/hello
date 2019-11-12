import { Component, OnInit, ViewEncapsulation, ViewChild } from '@angular/core';
import { Observable } from 'rxjs';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';
import { getAllAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { filter, tap, map, take, combineLatest } from 'rxjs/operators';
import { SelectItem, ConfirmationService } from 'primeng/api';
import { mapArray } from '@val/common';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { FieldContentTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { AppProjectPrefService } from 'app/services/app-project-pref.service';
import { SuccessNotification } from '@val/messaging';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { EditCombinedAudiencesComponent } from './edit-combined-audiences/edit-combined-audiences.component';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { AppStateService } from 'app/services/app-state.service';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';

@Component({
  selector: 'val-combined-audience',
  templateUrl: './combined-audience.component.html',
  styleUrls: ['./combined-audience.component.scss'],
})
export class CombinedAudienceComponent implements OnInit {
  groupedAudiences$: Observable<SelectItem[]>;
  combinedAudiences$: Observable<Audience[]>;
  selectedColumns: Audience[];
  audienceForm: FormGroup;
  hasCombinedAudiences: boolean = false;
  audId: number = 1;
  combinedVariableNames: string[] = [];  



  constructor(private store$: Store<LocalAppState>,
              private fb: FormBuilder,
              private varService: TargetAudienceService,
              private appProjectPrefService: AppProjectPrefService,
              private confirmationService: ConfirmationService,
              private appStateService: AppStateService,
              ) { 

  }

  ngOnInit() {
    this.audienceForm = this.fb.group({
      combinedAudName: ['', Validators.required],
      audienceList: '',
    });
    this.groupedAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(audiences => audiences != null),
      map(aud => aud.filter(a => a.audienceSourceType === 'Offline' && a.fieldconte === 'PERCENT')),
      filter(a => a.length > 0),
      tap(audiences => this.hasCombinedAudiences = true),
      map(audList => audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
      mapArray(audience => ({label: audience.audienceName, value: audience})),
      );
      
    this.combinedAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null ),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined')),
      filter(filteredSet => filteredSet.length > 0),
      );
  }
  combineAudiences(audienceFields: any){
    const formData = {
      combinedAudName: audienceFields.combinedAudName,
      audienceList: audienceFields.audienceList
    };

    const combinedAudIds: string[] = [];
    if (audienceFields.audienceList.length > 0){
      audienceFields.audienceList.forEach(audience => {
      this.combinedVariableNames.push(audience.audienceName);
      combinedAudIds.push(audience.audienceIdentifier);
    }
    );
  }
    const fkId = this.audId++;
    const combinedAud: Audience = {
      audienceIdentifier: fkId.toString(),
      audienceName: audienceFields.combinedAudName,
      showOnMap: false,
      showOnGrid: false,
      exportInGeoFootprint: true,
      exportNationally: false,
      allowNationalExport: false,
      audienceSourceName: '',
      audienceSourceType: 'Combined',
      fieldconte: FieldContentTypeCodes.Percent,
      requiresGeoPreCaching: false,
      seq: fkId,
      isCombined: true,
      combinedAudiences: combinedAudIds,
      combinedVariableNames: this.combinedVariableNames.join()
    };
    this.varService.addAudience(combinedAud);
    this.store$.dispatch(new SuccessNotification({ message: 'The following audiences are created successfully:' + combinedAud.audienceName, notificationTitle: 'Combine Audience' }));

    this.appProjectPrefService.createPref('combined-audience', 'audience', combinedAud.audienceName, 'string');
    this.audienceForm.reset();

  }

  hasErrors(controlKey: string) : boolean {
    const control = this.audienceForm.get(controlKey);
    return (control.untouched || control.value == null) && (control.errors != null);
  }
  resetForm(){
    this.selectedColumns = null;
    this.audienceForm.reset();
  }

  onEdit(selectedAudience: Audience){
    this.audienceForm = this.fb.group({
      combinedAudName: selectedAudience.audienceName,
      audienceList: selectedAudience.combinedVariableNames,
    });

  }

  onDelete(audience: Audience){
    const message = 'Are you sure you want to delete the following combined variable? <br/> <br/>' +
    `${audience.audienceName}`;
    this.confirmationService.confirm({
      message: message,
      header: 'Delete Combined Variable',
      icon: 'ui-icon-delete',
      accept: () => {
        this.varService.removeAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
        this.store$.dispatch(new RemoveVar({varPk: audience.audienceIdentifier}));

        let metricText = null;
        metricText = `${audience.audienceIdentifier}~${audience.audienceName}~${audience.audienceSourceName}~${this.appStateService.analysisLevel$.getValue()}` ;
        this.store$.dispatch(new CreateAudienceUsageMetric('combined audience', 'delete', metricText));
      },
      reject: () => {}
    });
  }

  
}











