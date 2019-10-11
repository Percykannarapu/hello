import { Component, OnInit } from '@angular/core';
import { Store, select } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { Observable } from 'rxjs';
import { getBatchMapDialog } from 'app/state/batch-map/batch-map.selectors';
import { CreateBatchMap, CloseBatchMapDialog } from 'app/state/batch-map/batch-map.actions';
import { UserService } from 'app/services/user.service';

@Component({
  selector: 'val-batch-map-dialog',
  templateUrl: './batch-map-dialog.component.html',
  styleUrls: ['./batch-map-dialog.component.scss']
})
export class BatchMapDialogComponent implements OnInit {

  showBatchMapDialog$: Observable<boolean>;
  batchMapForm: FormGroup;
 

  constructor(private store$: Store<LocalAppState>,
    private fb: FormBuilder,
    private stateService: AppStateService,
    private userService: UserService) { 
    }

  ngOnInit() {
    this.batchMapForm = this.fb.group({
      title: ['', Validators.required],
      subTitle: '',
    });
    this.showBatchMapDialog$ = this.store$.select(getBatchMapDialog);
  }

  onSubmit(dialogFields: any) {
    const formData = {
      email: `${this.userService.getUser().username}@valassis.com`,
      title: dialogFields.title,
      subTitle: dialogFields.subTitle,
    };

    this.store$.dispatch(new CreateBatchMap({ templateFields: formData}));
    this.store$.dispatch(new CloseBatchMapDialog);
    this.batchMapForm.reset();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.batchMapForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(event: any){
      this.batchMapForm.reset();
      this.store$.dispatch(new CloseBatchMapDialog);
  }

}
