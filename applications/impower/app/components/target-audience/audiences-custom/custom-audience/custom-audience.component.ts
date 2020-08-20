import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { DeleteAudiences, FetchCustom } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppDiscoveryService } from 'app/services/app-discovery.service';
import { AppStateService } from 'app/services/app-state.service';
import { TargetAudienceService } from 'app/services/target-audience.service';
import { deleteCustomData } from 'app/state/data-shim/data-shim.selectors';
import { ImpProjectPrefService } from 'app/val-modules/targeting/services/ImpProjectPref.service';
import { ConfirmationService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Observable } from 'rxjs';
import * as xlsx from 'xlsx';
import { AppProjectPrefService } from '../../../../services/app-project-pref.service';
import { LocalAppState } from '../../../../state/app.interfaces';
import { ProjectPrefGroupCodes } from '../../../../val-modules/targeting/targeting.enums';

@Component({
  selector: 'val-custom-audience',
  templateUrl: './custom-audience.component.html'
})
export class CustomAudienceComponent implements OnInit {
  private readonly spinnerId = 'CUSTOM_UPLOAD';
  public audiences: Audience[] = [];
  public currentAnalysisLevel$: Observable<string>;

  @ViewChild('audienceUpload', { static: true }) private audienceUploadEl: FileUpload;

  constructor(private appProjectPrefService: AppProjectPrefService,
    private confirmationService: ConfirmationService,
    private varService: TargetAudienceService,
    private appStateService: AppStateService,
    private appDiscoveryService: AppDiscoveryService,
    private impProjectPrefService: ImpProjectPrefService,
              private store$: Store<LocalAppState>) {
                this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
              }

  ngOnInit() {
    this.store$.select(fromAudienceSelectors.allAudiences).subscribe(audiences => this.audiences = audiences.filter(aud => aud.audienceSourceType === 'Custom'));
    this.store$.select(deleteCustomData).subscribe(isDeleteCustomData => this.switchAnalysisLevel(isDeleteCustomData));
  }

  public uploadFile(event: any) : void {
    const reader = new FileReader();
    const name: string = event.files[0].name ? event.files[0].name.toLowerCase() : null;
    const key = this.spinnerId;
    let csvData: string;
    if (name != null) {
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Loading Audience Data'}));
      if (name.includes('.xlsx') || name.includes('.xls')) {
        reader.readAsBinaryString(event.files[0]);
        reader.onload = () => {
          try {
            const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
            const worksheetName: string = wb.SheetNames[0];
            const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
            csvData  = xlsx.utils.sheet_to_csv(ws);
            this.store$.dispatch(new FetchCustom({dataBuffer: csvData, fileName: name}));
          }
          catch (e) {
            this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Audience Upload Error', message: e}));
          }
          finally {
            this.store$.dispatch(new StopBusyIndicator({ key }));
            if (csvData != null)
               this.appProjectPrefService.createPref(ProjectPrefGroupCodes.CustomVar, name, csvData);
          }
        };
      } else {
        reader.readAsText(event.files[0]);
        reader.onload = () => {
          try {
            // TODO:  Will have to rework these try/catch/finally to happen from actions
            this.store$.dispatch(new FetchCustom({dataBuffer: reader.result.toString(), fileName: name}));
          }
          catch (e) {
            this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Audience Upload Error', message: e}));
          }
          finally {
            this.store$.dispatch(new StopBusyIndicator({ key }));
            if (reader.result != null)
               this.appProjectPrefService.createPref(ProjectPrefGroupCodes.CustomVar, name, reader.result.toString());
          }
        };
      }
    }

    this.audienceUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.audienceUploadEl.basicFileInput.nativeElement.value = '';
  }

  public deleteCustomData(){

    this.confirmationService.confirm({
      message: 'Are you sure you want to delete all custom data?',
      header: 'Delete Custom Data',
      icon: 'ui-icon-delete',
      accept: () => {
        this.deleteDataImpl();
        // need to clean up the map vars at some point, too
      },
      reject: () => {}
    });
  }

  switchAnalysisLevel(isCustomDataExists: boolean) {
    if (isCustomDataExists){
      this.deleteDataImpl();
    }
  }

  private deleteDataImpl() {
    const ids: string[] = [];
    this.audiences.forEach(aud => {
      this.varService.addDeletedAudience(aud.audienceSourceType, aud.audienceSourceName, aud.audienceIdentifier);
      this.varService.removeAudience(aud.audienceSourceType, aud.audienceSourceName, aud.audienceIdentifier);
      ids.push(aud.audienceIdentifier);
    });
    this.appProjectPrefService.deletePref(ProjectPrefGroupCodes.CustomVar);
    this.varService.syncProjectVars();
    this.store$.dispatch(new DeleteAudiences({ ids }));
  }
}