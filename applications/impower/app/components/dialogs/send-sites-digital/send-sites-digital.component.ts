import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { isNil, isNotNil } from '@val/common';
import { ErrorNotification } from '@val/messaging';
import { ImpProject } from 'app/val-modules/targeting/models/ImpProject';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { FullAppState } from '../../../state/app.interfaces';

@Component({
  templateUrl: './send-sites-digital.component.html'
})
export class SendSitesDigitalComponent implements OnInit {

   showDialog: boolean = false;
   digitalForm: FormGroup;

  constructor(private ddRef: DynamicDialogRef,
              private ddConfig: DynamicDialogConfig,
              private fb: FormBuilder,
              private store$: Store<FullAppState>) { }

  ngOnInit() {
    const currentProject: ImpProject = this.ddConfig.data.project;
    if (isNil(currentProject.projectId)) {
      this.store$.dispatch(ErrorNotification({message: 'The project must be saved before sending the custom site list to Valassis Digital' }));
      this.ddRef.close(false);
    } else if (isNotNil(currentProject.projectTrackerId)) {
      this.ddRef.close(true);
    } else {
      this.digitalForm = this.fb.group({
        clientName: ['', Validators.required],
      });
    }
  }

  send(form: any){
    this.ddRef.close(form.clientName);
  }

  closeDialog(event?: any){
    this.ddRef.close(false);
  }
}
