import { Component, ViewChild } from '@angular/core';
import { FileUpload } from 'primeng/primeng';
import * as xlsx from 'xlsx';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppGeoService } from './../../../services/app-geo.service';
import { ImpGeofootprintGeo } from './../../../val-modules/targeting/models/ImpGeofootprintGeo';

@Component({
  selector: 'val-upload-must-cover',
  templateUrl: './upload-must-cover.component.html',
  styleUrls: ['./upload-must-cover.component.css']
})
export class UploadMustCoverComponent {
   private readonly spinnerId = 'MUST_COVERS_UPLOAD';

   @ViewChild('mustCoverUpload') private mustCoverUploadEl: FileUpload;
 
   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService            
              ,private appGeoService: AppGeoService
              ,private geoService: ImpGeofootprintGeoService
              ,private store$: Store<LocalAppState>) { }

   public uploadFile(event: any) : void {
      const reader = new FileReader();
      const name: string = event.files[0].name ? event.files[0].name.toLowerCase() : null;
      const key = this.spinnerId;
      if (name != null) {
         this.store$.dispatch(new StartBusyIndicator({ key, message: 'Loading Must Cover Data'}));
         if (name.includes('.xlsx') || name.includes('.xls')) {
            reader.readAsBinaryString(event.files[0]);
            reader.onload = () => {
               try {
                  const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
                  const worksheetName: string = wb.SheetNames[0];
                  const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
                  const csvData  = xlsx.utils.sheet_to_csv(ws);
                  this.impGeofootprintGeoService.parseMustCoverFile(csvData, name);
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));                  
                  this.appGeoService.ensureMustCovers();
               }
            };
         }
         else {
            reader.readAsText(event.files[0]);
            reader.onload = () => {
               try {
                  this.impGeofootprintGeoService.parseMustCoverFile(reader.result.toString(), name);
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));
                  this.appGeoService.ensureMustCovers();
               }
            };
         }
      }
      this.mustCoverUploadEl.clear();      
      this.mustCoverUploadEl.basicFileInput.nativeElement.value = ''; // workaround for https://github.com/primefaces/primeng/issues/4816
   }
}
