import { Component, ViewChild } from '@angular/core';
import { AppMessagingService } from '../../../services/app-messaging.service';
import { FileUpload } from 'primeng/primeng';
import * as xlsx from 'xlsx';
import { TargetAudienceCustomService } from '../../../services/target-audience-custom.service';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { TargetAudienceService } from '../../../services/target-audience.service';

@Component({
  selector: 'val-custom-audience',
  templateUrl: './custom-audience.component.html'
})
export class CustomAudienceComponent {
  private readonly spinnerId = 'CUSTOM_UPLOAD';

  @ViewChild('audienceUpload') private audienceUploadEl: FileUpload;

  constructor(private messagingService: AppMessagingService,
              private audienceService: TargetAudienceCustomService,
              private parentAudienceService: TargetAudienceService) {
    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
   }

   private syncCheckData(result: AudienceDataDefinition[]){
  //  this.selectedVariables = this.selectedVariables.filter(node => node.data.identifier != result[0].audienceIdentifier);
  }

  public uploadFile(event: any) : void {
    const reader = new FileReader();
    const name: string = event.files[0].name ? event.files[0].name.toLowerCase() : null;
    if (name != null) {
      this.messagingService.startSpinnerDialog(this.spinnerId, 'Loading Audience Data');
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
            this.messagingService.showGrowlError('Audience Upload Error', e);
          } finally {
            this.messagingService.stopSpinnerDialog(this.spinnerId);
          }
        };
      } else {
        reader.readAsText(event.files[0]);
        reader.onload = () => {
          try {
            this.audienceService.parseFileData(reader.result, name);
          } catch (e) {
            this.messagingService.showGrowlError('Audience Upload Error', e);
          } finally {
            this.messagingService.stopSpinnerDialog(this.spinnerId);
          }
        };
      }
    }
    this.audienceUploadEl.clear();
    // workaround for https://github.com/primefaces/primeng/issues/4816
    this.audienceUploadEl.basicFileInput.nativeElement.value = '';
  }
}
