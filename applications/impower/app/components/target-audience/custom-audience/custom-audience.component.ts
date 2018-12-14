import { Component, ViewChild } from '@angular/core';
import { FileUpload } from 'primeng/primeng';
import * as xlsx from 'xlsx';
import { TargetAudienceCustomService } from '../../../services/target-audience-custom.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '../../../messaging';

@Component({
  selector: 'val-custom-audience',
  templateUrl: './custom-audience.component.html'
})
export class CustomAudienceComponent {
  private readonly spinnerId = 'CUSTOM_UPLOAD';

  @ViewChild('audienceUpload') private audienceUploadEl: FileUpload;

  constructor(private audienceService: TargetAudienceCustomService,
              private store$: Store<LocalAppState>) { }

  public uploadFile(event: any) : void {
    const reader = new FileReader();
    const name: string = event.files[0].name ? event.files[0].name.toLowerCase() : null;
    const key = this.spinnerId;
    if (name != null) {
      this.store$.dispatch(new StartBusyIndicator({ key, message: 'Loading Audience Data'}));
      if (name.includes('.xlsx') || name.includes('.xls')) {
        reader.readAsBinaryString(event.files[0]);
        reader.onload = () => {
          try {
            const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
            const worksheetName: string = wb.SheetNames[0];
            const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
            const csvData  = xlsx.utils.sheet_to_csv(ws);
            this.audienceService.parseFileData(csvData, name);
          } catch (e) {
            this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Audience Upload Error', message: e}));
          } finally {
            this.store$.dispatch(new StopBusyIndicator({ key }));
          }
        };
      } else {
        reader.readAsText(event.files[0]);
        reader.onload = () => {
          try {
            this.audienceService.parseFileData(reader.result, name);
          } catch (e) {
            this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Audience Upload Error', message: e}));
          } finally {
            this.store$.dispatch(new StopBusyIndicator({ key }));
          }
        };
      }
    }
    this.audienceUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.audienceUploadEl.basicFileInput.nativeElement.value = '';
  }
}
