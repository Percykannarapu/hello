import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification, StartBusyIndicator, StopBusyIndicator, SuccessNotification } from '@val/messaging';
import { FileUpload } from 'primeng/fileupload';
import { Observable } from 'rxjs';
import * as xlsx from 'xlsx';
import { AppGeoService } from '../../../services/app-geo.service';
import { AppProjectPrefService } from '../../../services/app-project-pref.service';
import { AppStateService } from '../../../services/app-state.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { ImpGeofootprintGeoService } from '../../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ProjectPrefGroupCodes } from '../../../val-modules/targeting/targeting.enums';
import { ConfirmationService } from 'primeng/api';
import { ImpProjectPrefService } from 'app/val-modules/targeting/services/ImpProjectPref.service';
import { ImpProjectService } from 'app/val-modules/targeting/services/ImpProject.service';

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
   public currentAnalysisLevel$: Observable<string>;
   public totalUploadedRowCount = 0;
   private fileName: string;
   public isMustCoverExists: boolean;

   @ViewChild('mustCoverUpload', { static: true }) private mustCoverUploadEl: FileUpload;

   constructor(private impGeofootprintGeoService: ImpGeofootprintGeoService
              , private appStateService: AppStateService
              , private appProjectPrefService: AppProjectPrefService
              , private confirmationService: ConfirmationService
              , private impProjectPrefService: ImpProjectPrefService 
              , private impProjectService: ImpProjectService
              , private store$: Store<LocalAppState>) { 
                this.currentAnalysisLevel$ = this.appStateService.analysisLevel$;
              }

   ngOnInit() {
    this.appStateService.analysisLevel$.subscribe(val => {
      this.isDisable = val != null ? false : true; 
      this.tooltip = this.isDisable ? 'Please select an Analysis Level before uploading a Must Cover file' : 'CSV or Excel format required: Geocode';
    });

    this.impGeofootprintGeoService.uploadFailuresObs$.subscribe(result => {
      if (this.impGeofootprintGeoService.uploadFailures.length == 0){
         this.impGeofootprintGeoService.uploadFailures.push(...result);
         this.isMustCoverExists = true;
      }
    });

    this.appStateService.currentProject$.subscribe(project => {
       this.isMustCoverExists = project.impProjectPrefs.some(pref => pref.prefGroup === 'MUSTCOVER' && pref.val != null);
       if (this.impGeofootprintGeoService.uploadFailures.length > 0)
         this.isMustCoverExists = true;
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
    this.impGeofootprintGeoService.uploadFailures = this.impGeofootprintGeoService.uploadFailures.filter(f => f.Number !== data.Number);
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
        }
        this.totalUploadedRowCount = uniqueGeos.length + this.impGeofootprintGeoService.uploadFailures.length;
        //ensure mustcover are active
        const uniqueGeoSet = new Set(uniqueGeos);
        this.impGeofootprintGeoService.get().forEach(geo => {
            if (uniqueGeoSet.has(geo.geocode)){
                  geo.isActive = true;
               }
         }
      );
      this.isMustCoverExists = uniqueGeos.length > 0;
      if (this.impGeofootprintGeoService.uploadFailures.length > 0)
         this.isMustCoverExists = true;
      this.impGeofootprintGeoService.makeDirty();
            this.totalUploadedRowCount = uniqueGeos.length + this.impGeofootprintGeoService.uploadFailures.length;
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
               }
               catch (e) {
                  this.store$.dispatch(new ErrorNotification({ notificationTitle: 'Must Cover Upload Error', message: e}));
               }
               finally {
                  this.store$.dispatch(new StopBusyIndicator({ key: key }));
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

   deleteMustCovers(){

      this.confirmationService.confirm({
         message: 'Do you want to delete all the Must Cover geos?',
         header: 'Delete Must Cover Confirmation',
         icon: 'ui-icon-delete',

         accept: () => {
             this.impGeofootprintGeoService.clearMustCovers();
             this.isMustCoverExists = false;
            this.impProjectService.get()[0].impProjectPrefs = this.impProjectPrefService.get().filter(pref => pref.prefGroup !== ProjectPrefGroupCodes.MustCover);;
            this.impGeofootprintGeoService.uploadFailures = [];
            if (this.impGeofootprintGeoService.uploadFailures.length > 0)
               this.isMustCoverExists = true;
         },
         reject: () => {
            this.isMustCoverExists = true;
         }

      });

      

   }
}
