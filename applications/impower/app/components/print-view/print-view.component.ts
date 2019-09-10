import { Component, OnInit} from '@angular/core';
import { LocalAppState } from 'app/state/app.interfaces';
import { Store, select } from '@ngrx/store';
import { printViewDialogFlag } from 'app/state/menu/menu.reducer';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { PrintMap, EsriLayerService, DeletePrintRenderer } from '@val/esri';
import { FormGroup, FormBuilder, Validators } from '@angular/forms';
import { AppConfig } from 'app/app.config';
import { ClosePrintViewDialog } from 'app/state/menu/menu.actions';
import { AppStateService } from 'app/services/app-state.service';

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
    this.displayDialog$ = this.store$.pipe(select(printViewDialogFlag));
  }

  onSubmit(dialogFields: any) {
    const currentProjectID = this.stateService.projectId$.getValue() != null ? this.stateService.projectId$.getValue() : '';
    const formData = {
      title: dialogFields.title,
      author: dialogFields.subTitle,
      customTextElements: [dialogFields.geoInfo, currentProjectID]
    };
    this.store$.dispatch(new PrintMap({ templateOptions: formData, serviceUrl: this.config.serviceUrls.valPrintService}));
    this.printForm.reset();
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.printForm.get(controlKey);
    return (control.dirty || control.untouched || control.value == null) && (control.errors != null);
  }

  closeDialog(event: any){
      this.printForm.reset();
      this.currentAnalysisLevel = this.stateService.analysisLevel$.getValue();
      this.store$.dispatch(new DeletePrintRenderer({portalId: this.config.getLayerIdForAnalysisLevel(this.currentAnalysisLevel, true)}));
      this.store$.dispatch(new ClosePrintViewDialog);
  }
  
}
