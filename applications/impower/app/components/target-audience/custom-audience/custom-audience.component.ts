import { Component, ViewChild, OnInit } from '@angular/core';
import { FileUpload } from 'primeng/fileupload';
import * as xlsx from 'xlsx';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ProjectPrefGroupCodes } from '../../../val-modules/targeting/targeting.enums';
import { AppProjectPrefService } from '../../../services/app-project-pref.service';
import { FetchCustom, DeleteAudiences, SelectMappingAudience } from 'app/impower-datastore/state/transient/audience/audience.actions';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { BehaviorSubject } from 'rxjs';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { ConfirmationService } from 'primeng/api';
import { ClearMapVars } from 'app/impower-datastore/state/transient/map-vars/map-vars.actions';

@Component({
  selector: 'val-custom-audience',
  templateUrl: './custom-audience.component.html'
})
export class CustomAudienceComponent implements OnInit {
  private readonly spinnerId = 'CUSTOM_UPLOAD';
  private allAudiencesBS$ = new BehaviorSubject<Audience[]>([]);
  public audiences: Audience[] = [];

  @ViewChild('audienceUpload', { static: true }) private audienceUploadEl: FileUpload;

  constructor(private appProjectPrefService: AppProjectPrefService,
    private confirmationService: ConfirmationService,
              private store$: Store<LocalAppState>) {}
  
  ngOnInit() { 
    this.store$.select(fromAudienceSelectors.getAllAudiences).subscribe(audiences => this.audiences = audiences.filter(aud => aud.audienceSourceType === 'Custom'));
    //this.audiences = this.allAudiencesBS$.value.filter(aud => aud.audienceSourceType === 'Custom');
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
    const ids: string[] = [];
    let audience: Audience = null;
    this.audiences.forEach(aud => {
      if (aud.showOnMap == true){
        aud.showOnMap = false;
        audience = aud;
      }
      
      ids.push(aud.audienceIdentifier);
    });
    this.confirmationService.confirm({
      message: 'Are you sure you want to delete all custom data?',
      header: 'Delete Custom Data',
      icon: 'ui-icon-delete',
      accept: () => {
        if (audience != null){
          this.store$.dispatch(new ClearMapVars());
          this.store$.dispatch(new SelectMappingAudience({ audienceIdentifier: audience.audienceIdentifier, isActive: audience.showOnMap }));
        }
        this.store$.dispatch(new DeleteAudiences({ids: ids}));
      },
      reject: () => {}
    });
  }
}
