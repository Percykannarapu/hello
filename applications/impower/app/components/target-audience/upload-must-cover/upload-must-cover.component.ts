import { ProjectPrefGroupCodes } from './../../../val-modules/targeting/targeting.enums';
import { AppStateService } from './../../../services/app-state.service';
import { AppProjectPrefService } from './../../../services/app-project-pref.service';
import { Component, ViewChild, OnInit } from '@angular/core';
import { FileUpload } from 'primeng/primeng';
import * as xlsx from 'xlsx';
import { Store } from '@ngrx/store';
import { LocalAppState } from '../../../state/app.interfaces';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator, SuccessNotification } from '@val/messaging';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { AppGeoService } from './../../../services/app-geo.service';
import { ImpGeofootprintGeo } from './../../../val-modules/targeting/models/ImpGeofootprintGeo';
import { Observable } from 'rxjs';

interface CustomMCDefinition {
  Number: number;
  geocode: string;
}

@Component({
  selector: 'val-upload-must-cover',
  templateUrl: './upload-must-cover.component.html',
  styleUrls: ['./upload-must-cover.component.css']
})
export class UploadMustCoverComponent implements OnInit {
   private readonly spinnerId = 'MUST_COVERS_UPLOAD';
   public isDisable: boolean;
   public tooltip;
   public uploadFailures: CustomMCDefinition[] = [];
   public currentAnalysisLevel$: Observable<string>;
   public totalUploadedRowCount = 0;
   private fileName: string;

   @ViewChild('mustCoverUpload') private mustCoverUploadEl: FileUpload;

   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService
              , private appGeoService: AppGeoService
              , private appStateService: AppStateService
              , private appProjectPrefService: AppProjectPrefService
              , private geoService: ImpGeofootprintGeoService
              , private store$: Store<LocalAppState>) { 
                this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
              }

   ngOnInit() {
    this.appStateService.analysisLevel$.subscribe(val => {
      this.isDisable = val != null ? false : true; 
      this.tooltip = this.isDisable ? 'Please select an Analysis Level before uploading a Must Cover file' : 'CSV or Excel format required: Geocode';
    });

    this.impGeofootprintGeoService.uploadFailuresObs$.subscribe(result => {
      if (this.uploadFailures.length == 0)
          this.uploadFailures.push(...result);
    });

   }

   public onResubmit(data: CustomMCDefinition){
     let csvData = 'Geocode \n';
     csvData = csvData + data.geocode;
     //this.onRemove(data);
    this.parseMustcovers(csvData, this.fileName, true, data);

   }

   public onRemove(data: CustomMCDefinition){
    this.totalUploadedRowCount -= 1;
    this.uploadFailures = this.uploadFailures.filter(f => f.Number !== data.Number);
   }


   private parseMustcovers(dataBuffer: string, fileName: string, isResubmit: boolean = false, customMCDefinition?: CustomMCDefinition){
    let uniqueGeos: string[] = [];
    this.impGeofootprintGeoService.parseMustCoverFile(dataBuffer, fileName, this.appStateService.analysisLevel$.getValue()).subscribe(
      geos => {
          if (geos.length > 0){
            uniqueGeos = geos;
            
          }
      }, null , () => {
        // Create a new project pref for the upload file
        const mustcovetText = isResubmit ? 'Must Cover Resubmit' : 'Must Cover Upload';
        this.store$.dispatch(new SuccessNotification({ message: 'Completed', notificationTitle: mustcovetText}));
        this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, mustcovetText + name, uniqueGeos.join(', '));
        if (isResubmit && uniqueGeos.length > 0){
          this.onRemove(customMCDefinition);
          console.log(' ro be removed from failure grid::', uniqueGeos);
        }
        this.totalUploadedRowCount = uniqueGeos.length + this.uploadFailures.length; 
        //ensure mustcover are active 
        const uniqueGeoSet = new Set(uniqueGeos);
        this.impGeofootprintGeoService.get().forEach(geo => {
        if (uniqueGeoSet.has(geo.geocode)){
        geo.isActive = true;
}
});
this.impGeofootprintGeoService.makeDirty();
      } 
    );
   }

   public uploadFile(event: any) : void {
      const reader = new FileReader();
      this.fileName = event.files[0].name ? event.files[0].name.toLowerCase() : null;
      const key = this.spinnerId;
      const project = this.appStateService.currentProject$.getValue();
      //let uniqueGeos: string[] = [];
      if (name != null) {
         this.store$.dispatch(new StartBusyIndicator({ key, message: 'Loading Must Cover Data'}));
         if (this.fileName.includes('.xlsx') || this.fileName.includes('.xls')) {
            reader.readAsBinaryString(event.files[0]);
            reader.onload = () => {
               try {
                  const wb: xlsx.WorkBook = xlsx.read(reader.result, {type: 'binary'});
                  const worksheetName: string = wb.SheetNames[0];
                  const ws: xlsx.WorkSheet = wb.Sheets[worksheetName];
                  const csvData  = xlsx.utils.sheet_to_csv(ws);
                  this.parseMustcovers(csvData, this.fileName);
                  /*this.impGeofootprintGeoService.parseMustCoverFile(csvData, name, this.appStateService.analysisLevel$.getValue()).subscribe(
                    geos => {
                        if (geos.length > 0){
                          uniqueGeos = geos;
                          this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, 'Must Cover Upload: ' + name, geos.join(', '));
                        }
                    }, null , () => {
                      this.totalUploadedRowCount = uniqueGeos.length + this.uploadFailures.length; 
                    } 
                  );*/
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));
                  // Create a new project pref for the upload file
                  // if (uniqueGeos.length > 0)
                  //    this.appProjectPrefService.createPref(ProjectPrefGroupCodes.MustCover, "Must Cover Upload: " + name, uniqueGeos.join(", "));
               }
            };
         }
         else {
            reader.readAsText(event.files[0]);
            reader.onload = () => {
               try {
                this.parseMustcovers(reader.result.toString(), this.fileName);
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));
                  // Create a new project pref for the upload file
                  
               }
            };
         }
      }
      this.mustCoverUploadEl.clear();
      this.mustCoverUploadEl.basicFileInput.nativeElement.value = ''; // workaround for https://github.com/primefaces/primeng/issues/4816
   }
}
