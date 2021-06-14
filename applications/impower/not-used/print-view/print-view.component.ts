import {Component, OnInit} from '@angular/core';
import {FormBuilder, FormGroup, Validators} from '@angular/forms';
import {select, Store} from '@ngrx/store';
import {PrintMap} from '@val/esri';
import {AppConfig} from 'app/app.config';
import {AppStateService} from 'app/services/app-state.service';
import {LocalAppState} from 'app/state/app.interfaces';
import {ClosePrintViewDialog} from 'app/state/menu/menu.actions';
import {Observable} from 'rxjs';
import {printViewDialogFlag} from '../../state/menu/menu.selectors';

@Component({
  selector: 'val-print-view',
  templateUrl: './print-view.component.html',
  styleUrls: ['./print-view.component.css']
})
export class PrintViewComponent implements OnInit {

  displayDialog$: Observable<boolean>;
  printForm: FormGroup;
  currentAnalysisLevel: string;

  constructor(private store$: Store<LocalAppState>,
              private fb: FormBuilder,
              private config: AppConfig,
              private stateService: AppStateService,
              ) { }

  ngOnInit() {

    this.printForm = this.fb.group({
      title: ['', Validators.required],
      subTitle: '',
      geoInfo: '',
    });
    this.displayDialog$ = this.store$.select(printViewDialogFlag);
  }

  onSubmit(dialogFields: any) {
    const currentProjectID = this.stateService.projectId$.getValue() != null ? this.stateService.projectId$.getValue() : '';
    const formData = {
      title: dialogFields.title,
      author: dialogFields.subTitle,
      customTextElements: [dialogFields.geoInfo, currentProjectID.toString()]
    };
    // this.store$.dispatch(new PrintMap({ templateOptions: formData, serviceUrl: this.config.serviceUrls.valPrintService}));
    this.printForm.reset();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.printForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(event: any){
      this.printForm.reset();
      this.currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
      this.store$.dispatch(new ClosePrintViewDialog);
  }

}
