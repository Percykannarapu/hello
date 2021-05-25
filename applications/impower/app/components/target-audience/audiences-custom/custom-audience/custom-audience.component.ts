import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { DeleteAudiences } from 'app/impower-datastore/state/transient/audience/audience.actions';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppDiscoveryService } from 'app/services/app-discovery.service';
import { AppStateService } from 'app/services/app-state.service';
import { deleteCustomData } from 'app/state/data-shim/data-shim.selectors';
import { ImpProjectPrefService } from 'app/val-modules/targeting/services/ImpProjectPref.service';
import { ConfirmationService } from 'primeng/api';
import { FileUpload } from 'primeng/fileupload';
import { Observable } from 'rxjs';
import * as xlsx from 'xlsx';
import { clearCustomVars } from '../../../../impower-datastore/state/transient/custom-vars/custom-vars.actions';
import { AppProjectPrefService } from '../../../../services/app-project-pref.service';
import { CustomDataService } from '../../../../services/custom-data.service';
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

  @ViewChild('audienceUpload', {static: true}) private audienceUploadEl: FileUpload;

  constructor(private appProjectPrefService: AppProjectPrefService,
              private confirmationService: ConfirmationService,
              private customDataService: CustomDataService,
              private appStateService: AppStateService,
              private appDiscoveryService: AppDiscoveryService,
              private impProjectPrefService: ImpProjectPrefService,
              private store$: Store<LocalAppState>) {
    this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
  }

  ngOnInit() {
    this.store$.select(fromAudienceSelectors.allAudiences).subscribe(audiences => this.audiences = audiences.filter(aud => aud.audienceSourceType === 'Custom'));
    this.store$.select(deleteCustomData).subscribe(() => this.deleteCustomDataStore());
  }

  public uploadFile(event: any) {
    const reader = new FileReader();
    const name: string = event.files[0].name ? event.files[0].name.toLowerCase() : null;
    const key = this.spinnerId;
    let csvData: string;
    if (name != null) {
      this.store$.dispatch(new StartBusyIndicator({key, message: 'Loading Audience Data'}));
      if (name.includes('.xlsx') || name.includes('.xls')) {
        reader.readAsBinaryString(event.files[0]);
        reader.onload = () => {
          try {
            const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
            const worksheetName: string = wb.SheetNames[0];
            const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
            csvData = xlsx.utils.sheet_to_csv(ws);
            this.processFile(name, csvData);
          } finally {
            this.store$.dispatch(new StopBusyIndicator({key}));
          }
        };
      } else {
        reader.readAsText(event.files[0]);
        reader.onload = () => {
          try {
            this.processFile(name, reader.result.toString());
          } finally {
            this.store$.dispatch(new StopBusyIndicator({key}));
          }
        };
      }
    }

    this.audienceUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.audienceUploadEl.basicFileInput.nativeElement.value = '';
  }

  private processFile(fileName: string, fileData: string) {
    try {
      if (this.validateDuplicateFile(fileData.split(/\r\n|\n|\r/)[0])) {
        this.customDataService.parseCustomVarData(fileData, fileName, this.audiences);
      }
    } catch (e) {
      this.store$.dispatch(new ErrorNotification({notificationTitle: 'Audience Upload Error', message: e}));
    } finally {
      if (fileData != null)
        this.appProjectPrefService.createPref(ProjectPrefGroupCodes.CustomVar, fileName, fileData);
    }
  }

  private validateDuplicateFile(headerRow: string) {
    let isValid = true;
    const headers = new Set(headerRow.split(','));
    this.audiences.forEach(aud => {
      if (headers.has(aud.audienceName)) {
        this.store$.dispatch(new ErrorNotification({
          notificationTitle: 'Audience Upload Error',
          message: `Field Name ${aud.audienceName} already exists in Selected Audiences. Please revise and upload again.`
        }));
        isValid = false;
      }
    });
    return isValid;
  }

  public deleteCustomData() {
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete all custom data?',
      header: 'Delete Custom Data',
      icon: 'pi pi-trash',
      accept: () => {
        this.deleteCustomDataStore();
      },
      reject: () => {
      }
    });
  }

  private deleteCustomDataStore() {
    const ids: string[] = [];
    this.audiences.forEach(aud => {
      ids.push(aud.audienceIdentifier);
    });
    this.store$.dispatch(new DeleteAudiences({ids}));
    this.store$.dispatch(clearCustomVars());
  }
}
