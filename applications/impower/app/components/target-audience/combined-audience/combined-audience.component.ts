import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { mapArray } from '@val/common';
import { SuccessNotification } from '@val/messaging';
import { FieldContentTypeCodes } from 'app/impower-datastore/state/models/impower-model.enums';
import { UpsertAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { getAllAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { RemoveVar } from 'app/impower-datastore/state/transient/geo-vars/geo-vars.actions';
import { AppProjectPrefService } from 'app/services/app-project-pref.service';
import { AppStateService } from 'app/services/app-state.service';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { CreateAudienceUsageMetric } from 'app/state/usage/targeting-usage.actions';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { ImpProjectVarService } from '../../../val-modules/targeting/services/ImpProjectVar.service';

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
  allAudiences: Audience[];
  currentAudience: any;

  constructor(private store$: Store<LocalAppState>,
              private fb: FormBuilder,
              private varService: TargetAudienceService,
              private appProjectPrefService: AppProjectPrefService,
              private confirmationService: ConfirmationService,
              private appStateService: AppStateService,
              private impVarService: ImpProjectVarService
              ) {

  }

  ngOnInit() {
    this.audienceForm = this.fb.group({
      combinedAudName: ['', Validators.required],
      audienceList: '',
      audienceId: '',
    });
    this.groupedAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(audiences => audiences != null),
      map(aud => {
        this.allAudiences = aud;
        return aud.filter(a => a.audienceSourceType === 'Offline' && a.fieldconte === 'PERCENT');
      }),
      map(audList =>  audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
      mapArray(audience => ({label: audience.audienceName, value: audience})),
      );

    this.combinedAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null ),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined')),
      );
    }
  combineAudiences(audienceFields: any){
        const combinedAudIds: string[] = [];
        const combinedVariableNames: string[] = [];
        if (audienceFields.audienceList.length > 0){
            audienceFields.audienceList.forEach(audience => {
            combinedVariableNames.push(audience.audienceName);
            combinedAudIds.push(audience.audienceIdentifier);
          }
          );
        }
        if (audienceFields.audienceId == null || audienceFields.audienceId.length === 0){
            const fkId =  this.impVarService.getNextStoreId();
            const combinedAud: Audience = {
              audienceIdentifier: fkId.toString(),
              audienceName: audienceFields.combinedAudName,
              showOnMap: false,
              showOnGrid: false,
              exportInGeoFootprint: true,
              exportNationally: false,
              allowNationalExport: false,
              audienceSourceName: 'TDA',
              audienceSourceType: 'Combined',
              fieldconte: FieldContentTypeCodes.Percent,
              requiresGeoPreCaching: false,
              seq: fkId,
              isCombined: true,
              combinedAudiences: combinedAudIds,
              combinedVariableNames: combinedVariableNames.join('~')
            };
            this.varService.addAudience(combinedAud);
            this.store$.dispatch(new SuccessNotification({ message: 'The following audience was created successfully: \n' + combinedAud.audienceName, notificationTitle: 'Combine Audience' }));

        } else{
          this.currentAudience = this.allAudiences.filter(a => a.audienceIdentifier === audienceFields.audienceId);
         const editedAudience: Audience = {
          audienceIdentifier: audienceFields.audienceId,
          audienceName: audienceFields.combinedAudName,
          showOnMap: this.currentAudience[0].showOnMap,
          showOnGrid: this.currentAudience[0].showOnGrid,
          exportInGeoFootprint: this.currentAudience[0].exportInGeoFootprint,
          exportNationally: this.currentAudience[0].exportNationally,
          allowNationalExport: this.currentAudience[0].allowNationalExport,
          audienceSourceName: this.currentAudience[0].audienceSourceName,
          audienceSourceType: this.currentAudience[0].audienceSourceType,
          fieldconte: this.currentAudience[0].fieldconte,
          requiresGeoPreCaching: this.currentAudience[0].requiresGeoPreCaching,
          seq: this.currentAudience[0].seq,
          isCombined: this.currentAudience[0].isCombined,
          combinedAudiences: combinedAudIds,
          combinedVariableNames: combinedVariableNames.join('~')
        };

        this.store$.dispatch(new UpsertAudience({ audience:  editedAudience}));
        this.store$.dispatch(new SuccessNotification({ message: 'The following audience was updated successfully: \n' + editedAudience.audienceName, notificationTitle: 'Combine Audience' }));

      }
      this.currentAudience = '';
      this.audienceForm.reset();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.audienceForm.get(controlKey);
    return (control.value == null) && (control.errors != null);
  }

  resetForm(){
    this.selectedColumns = null;
    this.audienceForm.reset();
  }

  onEdit(selectedAudience: Audience){
    const currentSelections: Audience[] = [];
    selectedAudience.combinedAudiences.forEach(previous => {
          this.allAudiences.forEach(current => {
          if (current != null && current.audienceIdentifier === previous)
             currentSelections.push(current);
          });
        });
    this.audienceForm = this.fb.group({
      combinedAudName: selectedAudience.audienceName,
      audienceList: currentSelections,
      audienceId: selectedAudience.audienceIdentifier
    });
    this.selectedColumns = currentSelections;
  }

  onDelete(audience: Audience){
    const message = 'Are you sure you want to delete the following combined variable? <br/> <br/>' +
    `${audience.audienceName}`;
    this.confirmationService.confirm({
      message: message,
      header: 'Delete Combined Variable',
      icon: 'ui-icon-delete',
      accept: () => {
        this.varService.addDeletedAudience(audience.audienceSourceType, audience.audienceSourceName, audience.audienceIdentifier);
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

