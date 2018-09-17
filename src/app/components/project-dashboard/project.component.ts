import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { AppLayerService } from '../../services/app-layer.service';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { UserService } from '../../services/user.service';
import { AppProjectService } from '../../services/app-project.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { calculateStatistics } from '../../app.utils';
import { EsriMapService } from '../../esri/services/esri-map.service';
import { AppLocationService } from '../../services/app-location.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { filter, take, map, tap } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { forkJoin } from 'rxjs/internal/observable/forkJoin';
import { ConfirmationService } from 'primeng/components/common/confirmationservice';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { EsriLayerService } from '../../esri/services/esri-layer.service';
import { ImpDomainFactoryService } from '../../val-modules/targeting/services/imp-domain-factory.service';
import { MetricService } from '../../val-modules/common/services/metric.service';
import { ImpGeofootprintMasterService } from '../../val-modules/targeting/services/ImpGeofootprintMaster.service';
import { ImpGeofootprintGeoAttribService } from '../../val-modules/targeting/services/ImpGeofootprintGeoAttribService';
import { ImpGeofootprintVarService } from '../../val-modules/targeting/services/ImpGeofootprintVar.service';
import { ImpGeofootprintLocAttribService } from '../../val-modules/targeting/services/ImpGeofootprintLocAttrib.service';
import { TargetAudienceService } from '../../services/target-audience.service';


@Component({
    selector: 'val-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.css']
  })
  export class ProjectComponent implements OnInit, AfterViewInit {

    public timeLines;
    public selectedTimeLine = 'sixMonths';
    public todayDate = new Date();
    public display: boolean;
    public customDialogDisplay: boolean;
    public selectedRow;
    public loadEvent: any;


    overlaySub: Subscription;

    constructor(private restService: RestDataService,
                private userService: UserService,
                public  appProjectService: AppProjectService,
                public  impGeofootprintGeoService: ImpGeofootprintGeoService,
                private impGeofootprintLocationService: ImpGeofootprintLocationService,
                private esriMapService: EsriMapService,
                private appLocationService: AppLocationService,
                private impGeofootprintTradeArea: ImpGeofootprintTradeAreaService,
                private appTradeAreaService: AppTradeAreaService,
                private stateService: AppStateService,
                private usageService: UsageService,
                private messageService: AppMessagingService,
                private impProjectService: ImpProjectService,
                private confirmationService: ConfirmationService,
                private layerService: AppLayerService,
                public metricService: MetricService,
                private domainFactory: ImpDomainFactoryService,
                private attributeService: ImpGeofootprintGeoAttribService,
                private impGeofootprintLocAttribService: ImpGeofootprintLocAttribService,
                private impGeofootprintTradeAreaService: ImpGeofootprintTradeAreaService,
                private impGeofootprintVarService: ImpGeofootprintVarService,
                private impGeofootprintMasterService: ImpGeofootprintMasterService,
                private targetAudienceService: TargetAudienceService){

                  this.timeLines = [
                    {label: 'Last 6 Months',  value: 'sixMonths'},
                    {label: 'Current Month',  value: 'currentMonth'},
                    {label: 'Last 4 Weeks',   value: 'fourweeks'},
                    {label: 'Last 3 Months',  value: 'threeMonths'},
                    {label: 'Last 12 Months', value: 'tweleMonths'},
                    {label: 'Current Year',   value: 'currentYear'},
                    {label: 'Previous Year',  value: 'previousYear'}
                ];

    }

    public allColumns: any[] = [
     // { field: '',                     header: 'Select',                        size: '60px'},
     { field: 'projectId',                    header: 'imPower ID',                    size: '1px'},
     { field: 'projectTrackerId',             header: 'Project Tracker ID',            size: '50px'},
     { field: 'projectName',                  header: 'imPower Project Name',          size: '500px'},
     { field: 'projectTrackerClientName',     header: 'Client Name',                   size: '30px'},
     { field: 'modifyUserLoginname',          header: 'Username',                      size: '40px'},
     { field: 'modifyDate',                   header: 'Last Modified Date',            size: '40px'}
    ];

    public allProjectsData: any;
    public myProjecctsData: any;
    public selectedListType: 'myProject' | 'allProjects';
    public selectedColumns: any[] = [];
    public columnOptions: SelectItem[] = [];
    public projectColumns: string[];
    public currentProjectData: any[] = [];
    public selectedProjectData: any[] = [];

    ngOnInit() {
      this.selectedListType = 'myProject';

      for (const column of this.allColumns) {
        this.columnOptions.push({ label: column.header, value: column });
        this.selectedColumns.push(column);
      }

    }

    ngAfterViewInit(){
      this.selectedListType = 'myProject';
     
      const usrSub = this.userService.userObservable.subscribe(result => {
        if (result.userId != null){
          this.overlaySub = this.appProjectService.getngDialogObs().subscribe(bool => {
            this.display = bool;
            this.selectedListType = 'myProject';
              const updatedateFrom = this.todayDate;
              const updatedDateTo = new Date();
              updatedateFrom.setMonth(updatedateFrom.getMonth() - 6);

              const sub = this.getAllProjectsData(updatedateFrom, updatedDateTo).subscribe(data => {
                Array.from(data).forEach(row => {
                  const dt = new Date(row['modifyDate']);
                  row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
                });
                this.allProjectsData = data;
              }, null , () =>  this.searchFilterMetric());

              const sub1 = this.getMyProjectData(updatedateFrom, updatedDateTo).subscribe(data => {
                Array.from(data).forEach(row => {
                  const dt = new Date(row['modifyDate']);
                  row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
                });
                this.myProjecctsData = data;
                this.currentProjectData = this.myProjecctsData;
              });
            });
        }
       //;
      });

    }

    public getAllProjectsData(updatedDateFrom, updatedDateTo) : Observable<any>{
      updatedDateFrom.setDate(updatedDateFrom.getDate() - 1);
      updatedDateTo.setDate(updatedDateTo.getDate() + 1);
      updatedDateFrom = this.formatDate(updatedDateFrom);
      updatedDateTo = this.formatDate(updatedDateTo);
      return this.restService.get(`v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange&&updatedDateFrom=${updatedDateFrom}&&updatedDateTo=${updatedDateTo}`).pipe(
        map((result: any) => result.payload.rows)
       );
    }

    public getMyProjectData(updatedDateFrom, updatedDateTo) : Observable<any>{
      let data: any[] = [];
      updatedDateFrom.setDate(updatedDateFrom.getDate() - 1);
      updatedDateTo.setDate(updatedDateTo.getDate() + 1);
      updatedDateFrom = this.formatDate(updatedDateFrom);
      updatedDateTo = this.formatDate(updatedDateTo);
      // console.log('url:::::', `v1/targeting/base/impproject/search?q=impproject&&createUser=${this.userService.getUser().userId}`);
      return this.restService.get(`v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange&&modifyUser=${this.userService.getUser().userId}&&updatedDateFrom=${updatedDateFrom}&&updatedDateTo=${updatedDateTo}`).pipe(
        map((response ) => data = response.payload.rows));
    }

    public onListTypeChange(data: 'myProject' | 'allProjects') {
      this.selectedListType = data;
     
      if (this.selectedListType === 'myProject'){
          this.currentProjectData = this.myProjecctsData;
      }
      else {
        this.currentProjectData = this.allProjectsData;
      }
      this.searchFilterMetric();
    }

    public onProjectSelected(event){
      this.selectedProjectData.push(event);
    }

    public onSelectTimeFrame(event: string){
      const updatedateFrom = new Date();
      const updatedDateTo = new Date();
      this.selectedTimeLine = event;
     

      if (event.toLowerCase() === 'sixmonths'){
        updatedateFrom.setMonth(updatedateFrom.getMonth() - 6);
      }
      if (event.toLowerCase() === 'currentmonth'){
        updatedateFrom.setDate(1);
        updatedDateTo.setDate(30);
      }
      if (event.toLowerCase() === 'fourweeks'){
         updatedateFrom.setDate(updatedateFrom.getDate() - 28);
      }
      if (event.toLowerCase() === 'threemonths'){
        updatedateFrom.setMonth(updatedateFrom.getMonth() - 3);
      }
      if (event.toLowerCase() === 'twelemonths'){
        updatedateFrom.setMonth(updatedateFrom.getMonth() - 12);
      }
      if (event.toLowerCase() === 'currentyear'){
        updatedateFrom.setMonth(1);
        updatedateFrom.setDate(1);
        updatedDateTo.setMonth(12);
        updatedDateTo.setDate(31);
      }
      if (event.toLowerCase() === 'previousyear'){
        updatedateFrom.setMonth(1);
        updatedateFrom.setDate(1);
        updatedateFrom.setFullYear(updatedateFrom.getFullYear() - 1);
        updatedDateTo.setMonth(12);
        updatedDateTo.setDate(31);
        updatedDateTo.setFullYear(updatedDateTo.getFullYear() - 1);
      }

      const allProject$ =  this.getAllProjectsData(updatedateFrom, updatedDateTo).pipe(
        tap(data => {
          Array.from(data).forEach(row => {
            const dt = new Date(row['modifyDate']);
            row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
  
          });
          this.allProjectsData = data;
        }));

        const myProject$ =  this.getMyProjectData(updatedateFrom, updatedDateTo).pipe(
          tap(data => {
            Array.from(data).forEach(row => {
              const dt = new Date(row['modifyDate']);
              row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
    
            });
            this.myProjecctsData = data;
          }));
       
      forkJoin(allProject$, myProject$).subscribe(null, null, () => {

        if (this.selectedListType === 'myProject'){
          this.currentProjectData = this.myProjecctsData;
          this.searchFilterMetric();
        }
        else {
          this.currentProjectData = this.allProjectsData;
          this.searchFilterMetric();
        }

      });    

     /* const sub = this.getAllProjectsData(updatedateFrom, updatedDateTo).subscribe(data => {
        Array.from(data).forEach(row => {
          const dt = new Date(row['modifyDate']);
          row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();

        });
        this.allProjectsData = data;
      }, null , () => {
        if (this.selectedListType === 'myProject'){
          this.currentProjectData = this.myProjecctsData;
          this.searchFilterMetric();
        }
        else {
          this.currentProjectData = this.allProjectsData;
          this.searchFilterMetric();
        }
        
      });

      const sub1 = this.getMyProjectData(updatedateFrom, updatedDateTo).subscribe(data => {
        Array.from(data).forEach(row => {
          const dt = new Date(row['modifyDate']);
          row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();

        });
        this.myProjecctsData = data;
       // this.currentProjectData = this.myProjecctsData;
      }, null, () => {
        if (this.selectedListType === 'myProject'){
          this.currentProjectData = this.myProjecctsData;
          this.searchFilterMetric();
        }
        else {
          this.currentProjectData = this.allProjectsData;
          this.searchFilterMetric();
        }
       
      });*/
    }

    public formatDate(date) {
      const year = date.getFullYear().toString();
      const month = (date.getMonth() + 101).toString().substring(1);
      const day = (date.getDate() + 100).toString().substring(1);
      return year + '-' + month + '-' + day;
    }

    public dbClick(event: { originalEvent: MouseEvent, data: { projectId: number }}){
       this.loadProject(event.data);
    }

    public loadProject(event: { projectId: number }){
      const impProject = this.stateService.currentProject$.getValue();
      const locData = this.impGeofootprintLocationService.get();
      if ( locData.length > 0 || this.impGeofootprintGeoService.get().length > 0){
        this.customDialogDisplay = true;
        this.loadEvent = event;
       /* this.confirmationService.confirm({
          message: 'Would you like to save your work before proceeding?',
          header: 'Save Work',
          icon: 'ui-icon-save',
          accept: () => {
            console.log('test accespt', document.getElementById('myDialog'));
              // check for required fields
           let errorString = null;
          if (impProject.projectName == null || impProject.projectName == '')
               errorString = 'imPower Project Name is required<br>';
          if (impProject.methAnalysis == null || impProject.methAnalysis == '')
               errorString += 'Analysis level is required';
          if (errorString != null) {
              this.messageService.showGrowlError('Error Saving Project', errorString);
              return;
          }
                  this.impProjectService.saveProject().subscribe(impPro => {
                    const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'save' });
                    this.usageService.createCounterMetric(usageMetricName, null, impPro.projectId);
                    this.onLoadProject(event);
                  });
          },
          reject: () => {  
           // console.log('test reject::', e);
           // console.log('test reject', document.getElementById('myDialog'));
            this.onLoadProject(event); }
        });*/
      }
      else{
        this.onLoadProject(event);
      }

         
      
    }

    private onLoadProject(event: { projectId: number }) : void {
      const locData = this.impGeofootprintLocationService.get();
      this.stateService.loadProject(event.projectId).subscribe(project => {
        const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'load' });
        this.usageService.createCounterMetric(usageMetricName, null, null);
        const taData = project.getImpGeofootprintTradeAreas();
        if (taData != null && taData.length > 0) {
          console.log('Subing to zoom');
          combineLatest(this.stateService.uniqueIdentifiedGeocodes$, this.stateService.analysisLevel$).pipe(
            filter(([geos, al]) => geos != null && geos.length > 0 && al != null && al.length > 0),
            take(1)
          ).subscribe (() => {
            console.log('Zooming to TA');
            this.appTradeAreaService.zoomToTradeArea();
          });
        } else {
          this.appLocationService.zoomToLocations(locData);
        }
      }, null, () => {
        const audiences = this.targetAudienceService.getAudiences();
        const mappedAudience = audiences.find(a => a.showOnMap === true);
        if (mappedAudience != null){
          this.targetAudienceService.applyAudienceSelection();
        }
      });
      this.display = false;
      this.selectedListType = 'myProject';
      
    }

    public onSearch(event, count){
      //console.log('test:::::', event, 'count::::', count);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'search' });
      const metricText  = `userFilter=${event}~timeFilter=${this.selectedTimeLine}`;
      //this.usageService.createCounterMetric(usageMetricName, metricText, count);
    }

    private searchFilterMetric(){
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'search' });
      const metricText  = `userFilter=${this.selectedListType}~timeFilter=${this.selectedTimeLine}`;
      this.usageService.createCounterMetric(usageMetricName, metricText, (this.currentProjectData != null) ? this.currentProjectData.length : 0);
    }

    private close(){
      console.log('close conformation box');
    }

    public accept(){
      const impProject = this.stateService.currentProject$.getValue();
      const locData = this.impGeofootprintLocationService.get();
      let errorString = null;
      if (impProject.projectName == null || impProject.projectName == '')
            errorString = 'imPower Project Name is required';
      if (impProject.methAnalysis == null || impProject.methAnalysis == '')
            errorString  = errorString + '\n Analysis Level is required';
      if (errorString != null){
            this.messageService.showErrorNotification('Error Saving Project', errorString);
            return;
      }
              this.impProjectService.saveProject().subscribe(impPro => {
                const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'save' });
                this.usageService.createCounterMetric(usageMetricName, null, impPro.projectId);
                this.customDialogDisplay = false;
                setTimeout(() => {
                  this.clearProject();
                  }, 100);
               
                setTimeout(() => {
                  this.onLoadProject(this.loadEvent);
                  }, 1000);
                
              });
    }

    public reject(){
      this.clearProject();
      setTimeout(() => {
        this.onLoadProject(this.loadEvent); 
        this.customDialogDisplay = false;
        }, 1000);
     
      
    }

    public clearProject(){
      this.impGeofootprintMasterService.clearAll();
      this.impProjectService.clearAll();
      this.appProjectService.clearAll();
      this.appLocationService.deleteLocations(this.impGeofootprintLocationService.get());
      this.stateService.clearUserInterface.next(true);
      this.messageService.clearNotifications();
       this.impGeofootprintGeoService.clearAll();
       this.attributeService.clearAll();
       this.impGeofootprintTradeAreaService.clearAll(); //this is not working
       this.impGeofootprintLocationService.clearAll();
       this.impGeofootprintVarService.clearAll();
       this.impGeofootprintLocAttribService.clearAll();
       
       this.stateService.clearUserInterface.next(false);

       const newProject = this.domainFactory.createProject();
       this.impProjectService.add([newProject]);

       this.metricService.metrics.clear();
       this.metricService.add('CAMPAIGN', 'Household Count', '0');
       this.metricService.add('CAMPAIGN', 'IP Address Count', '0');
       this.metricService.add('CAMPAIGN', 'Est. Total Investment', '0');
       this.metricService.add('CAMPAIGN', 'Progress to Budget', '0');

       this.metricService.add('AUDIENCE', 'Median Household Income', '0');
       this.metricService.add('AUDIENCE', '% \'17 HHs Families with Related Children < 18 Yrs', '0');
       this.metricService.add('AUDIENCE', '% \'17 Pop Hispanic or Latino', '0');
       this.metricService.add('AUDIENCE', 'Casual Dining: 10+ Times Past 30 Days', '0');

       this.metricService.add('PERFORMANCE', 'Predicted Response', '0');
       this.metricService.add('PERFORMANCE', 'Predicted Topline Sales Generated', '$0');
       this.metricService.add('PERFORMANCE', 'Cost per Response', '$0');

   }
  }
