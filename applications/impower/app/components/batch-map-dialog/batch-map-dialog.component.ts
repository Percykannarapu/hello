import { Component, OnInit, OnChanges } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalAppState, BatchMapPayload, BatchMapSizes } from 'app/state/app.interfaces';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { Observable } from 'rxjs';
import { getBatchMapDialog } from 'app/state/batch-map/batch-map.selectors';
import { CreateBatchMap, CloseBatchMapDialog } from 'app/state/batch-map/batch-map.actions';
import { UserService } from 'app/services/user.service';
import { filter } from 'rxjs/operators';
import { SelectItem } from 'primeng/api';

@Component({
  selector: 'val-batch-map-dialog',
  templateUrl: './batch-map-dialog.component.html',
  styleUrls: ['./batch-map-dialog.component.scss']
})
export class BatchMapDialogComponent implements OnInit {

  showBatchMapDialog$: Observable<boolean>;
  batchMapForm: FormGroup;
  currentProjectId: number;
  numSites: number = 0;
  pageSettings: SelectItem[];

  constructor(private store$: Store<LocalAppState>,
    private fb: FormBuilder,
    private stateService: AppStateService,
    private userService: UserService) {
      this.pageSettings = [
        {label: '8.5 x 11 (Letter)', value: BatchMapSizes.letter},
        {label: '8.5 x 14 (Legal)', value: BatchMapSizes.legal},
        {label: '11 x 17 (Tabloid)', value: BatchMapSizes.tabloid},
        {label: '24 x 36 (Arch-D)', value: BatchMapSizes.large},
        {label: '36 x 48 (Arch-E)', value: BatchMapSizes.jumbo}
      ];
    }

  initForm() {
    this.batchMapForm = this.fb.group({
      title: ['', Validators.required],
      subTitle: '',
      subSubTitle: '',
      neighboringSites: 'true',
      pageSettingsControl: BatchMapSizes.letter,
      layout: 'landscape',
    });
  }

  ngOnInit() {
    this.initForm();
    this.showBatchMapDialog$ = this.store$.select(getBatchMapDialog);
    this.stateService.currentProject$.pipe(filter(p => p != null)).subscribe(p => {
      this.currentProjectId = p.projectId;
      this.numSites = p.getImpGeofootprintLocations().length;
    });
  }

  onSubmit(dialogFields: any) {
    const size: BatchMapSizes = <BatchMapSizes> dialogFields.pageSettingsControl;
    const formData: BatchMapPayload = {
      calls: [
        {
          service: 'ImpowerPdf',
          function: 'printMaps',
          args: {
            printJobConfiguration: {
              email: `${this.userService.getUser().username}@valassis.com`,
              title: dialogFields.title,
              subTitle: dialogFields.subTitle,
              subSubTitle: dialogFields.subSubTitle,
              projectId: this.currentProjectId,
              size: size,
              pageSettings: dialogFields.pageSettingsControl,
              layout: dialogFields.layout,
              siteIds: this.getSiteIds(),
              hideNeighboringSites: !(dialogFields.neighboringSites == 'true')
            }
          }
        }
      ]
    };

    this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    this.closeDialog();
  }

  private getSiteIds() : Array<string> {
    const siteIds: Array<string> = [];
    this.stateService.currentProject$.getValue().impGeofootprintMasters[0].impGeofootprintLocations.forEach(s => siteIds.push(s.locationNumber));
    return siteIds;
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.batchMapForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(){
      this.batchMapForm.reset();
      this.store$.dispatch(new CloseBatchMapDialog());
      this.initForm();
  }

}
