import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Store } from '@ngrx/store';
import { ErrorNotification } from '@val/messaging';
import { AppStateService } from 'app/services/app-state.service';
import { projectIsReady } from 'app/state/data-shim/data-shim.selectors';
import { CloseclientNmaeForValassisDigitalDialog, ExportToValassisDigital } from 'app/state/menu/menu.actions';
import { openSendToValassisDigitalFlag } from 'app/state/menu/menu.selectors';
import { ImpProject } from 'app/val-modules/targeting/models/ImpProject';
import { LocalAppState } from '../../state/app.interfaces';

@Component({
  selector: 'val-send-sites-digital',
  templateUrl: './send-sites-digital.component.html'
})
export class SendSitesDigitalComponent implements OnInit {

   showDialog: boolean = false;
   digitalForm: FormGroup;

  constructor(private store$: Store<LocalAppState>,
              private stateService: AppStateService,
              private fb: FormBuilder) { }

  ngOnInit() {

    this.digitalForm = this.fb.group({
      clientName: ['', Validators.required],
    });

    this.store$.select(projectIsReady).subscribe((flag) => {
      if (flag)
          this.digitalForm.reset();
    });

    this.store$.select(openSendToValassisDigitalFlag).subscribe((flag) => {
        if (flag)
            this.openDialog(flag);
        else
            this.showDialog = flag;
    });
  }


  private openDialog(flag: boolean){
    const impProject: ImpProject  = this.stateService.currentProject$.getValue();
    if (impProject.projectId == null){
      const notificationTitle = 'Export Error';
      this.store$.dispatch(new ErrorNotification({notificationTitle, message: 'The project must be saved before sending the custom site list to Valassis Digital'}));
      this.closeDialog();
    }
    else if (impProject.projectTrackerId != null){
      this.store$.dispatch(new ExportToValassisDigital());
      this.closeDialog();
    }
    else
      this.showDialog = flag;
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.digitalForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  send(form: any){
    this.stateService.currentProject$.getValue().clientIdentifierName = form.clientName;
    this.store$.dispatch(new ExportToValassisDigital);
    //this.digitalForm.reset();
    this.store$.dispatch(new CloseclientNmaeForValassisDigitalDialog);
  }

  closeDialog(event?: any){
    //this.digitalForm.reset();
    this.store$.dispatch(new CloseclientNmaeForValassisDigitalDialog);
  }

}
