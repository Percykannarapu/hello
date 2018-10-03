import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { UserService } from '../../services/user.service';
import { AppProjectService } from '../../services/app-project.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppLocationService } from '../../services/app-location.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { Observable, forkJoin } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { TargetAudienceService } from '../../services/target-audience.service';

@Component({
    selector: 'val-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit, AfterViewInit {

    public showDialog: boolean;
    public timeLines;
    public selectedTimeLine = 'sixMonths';
    public todayDate = new Date();
    public customDialogDisplay: boolean;
    public selectedRow;
    public loadEvent: any;
    public allProjectsData: any;
    public myProjectsData: any;
    public selectedListType: 'myProject' | 'allProjects';
    public selectedColumns: any[] = [];
    public columnOptions: SelectItem[] = [];
    public currentProjectData: any[] = [];

    public allColumns: any[] = [
        // { field: '',                     header: 'Select',                        size: '60px'},
        { field: 'projectId',                    header: 'imPower ID',                    size: '10%'},
        { field: 'projectTrackerId',             header: 'Project Tracker ID',            size: '12%'},
        { field: 'projectName',                  header: 'imPower Project Name',          size: '24%'},
        { field: 'projectTrackerClientName',     header: 'Client Name',                   size: '24%'},
        { field: 'modifyUserLoginname',          header: 'Username',                      size: '10%'},
        { field: 'modifyDate',                   header: 'Last Modified Date',            size: '20%'}
      ];
    constructor(private restService: RestDataService,
                private userService: UserService,
                public  appProjectService: AppProjectService,
                private impGeofootprintLocationService: ImpGeofootprintLocationService,
                private appLocationService: AppLocationService,
                private appTradeAreaService: AppTradeAreaService,
                private stateService: AppStateService,
                private usageService: UsageService,
                private messageService: AppMessagingService,
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

    ngOnInit() {
      this.selectedListType = 'myProject';
      this.stateService.showLoadDialog$.subscribe(show => this.showDialog = show);
      for (const column of this.allColumns) {
        this.columnOptions.push({ label: column.header, value: column });
        this.selectedColumns.push(column);
      }
    }

    ngAfterViewInit(){
      this.stateService.applicationIsReady$.pipe(
        filter(isReady => isReady)
      ).subscribe(() => {
        this.selectedListType = 'myProject';
        const updatedDateFrom = this.todayDate;
        const updatedDateTo = new Date();
        updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);

        this.getAllProjectsData(updatedDateFrom, updatedDateTo).subscribe(data => {
          Array.from(data).forEach(row => {
            const dt = new Date(row['modifyDate']);
            row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
          });
          this.allProjectsData = data;
        }, null , () =>  this.searchFilterMetric());

        this.getMyProjectData(updatedDateFrom, updatedDateTo).subscribe(data => {
          Array.from(data).forEach(row => {
            const dt = new Date(row['modifyDate']);
            row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
          });
          this.myProjectsData = data;
          this.currentProjectData = this.myProjectsData;
        });
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
      updatedDateFrom.setDate(updatedDateFrom.getDate() - 1);
      updatedDateTo.setDate(updatedDateTo.getDate() + 1);
      updatedDateFrom = this.formatDate(updatedDateFrom);
      updatedDateTo = this.formatDate(updatedDateTo);
      return this.restService.get(`v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange&&modifyUser=${this.userService.getUser().userId}&&updatedDateFrom=${updatedDateFrom}&&updatedDateTo=${updatedDateTo}`).pipe(
        map((response) => response.payload.rows));
    }

    public onListTypeChange(data: 'myProject' | 'allProjects') {
      this.selectedListType = data;
     
      if (this.selectedListType === 'myProject'){
          this.currentProjectData = this.myProjectsData;
      }
      else {
        this.currentProjectData = this.allProjectsData;
      }
      this.searchFilterMetric();
    }

    public onSelectTimeFrame(event: string){
      const updatedDateFrom = new Date();
      const updatedDateTo = new Date();
      this.selectedTimeLine = event;
     

      if (event.toLowerCase() === 'sixmonths'){
        updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);
      }
      if (event.toLowerCase() === 'currentmonth'){
        updatedDateFrom.setDate(1);
        updatedDateTo.setDate(30);
      }
      if (event.toLowerCase() === 'fourweeks'){
         updatedDateFrom.setDate(updatedDateFrom.getDate() - 28);
      }
      if (event.toLowerCase() === 'threemonths'){
        updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 3);
      }
      if (event.toLowerCase() === 'twelemonths'){
        updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 12);
      }
      if (event.toLowerCase() === 'currentyear'){
        updatedDateFrom.setMonth(1);
        updatedDateFrom.setDate(1);
        updatedDateTo.setMonth(12);
        updatedDateTo.setDate(31);
      }
      if (event.toLowerCase() === 'previousyear'){
        updatedDateFrom.setMonth(1);
        updatedDateFrom.setDate(1);
        updatedDateFrom.setFullYear(updatedDateFrom.getFullYear() - 1);
        updatedDateTo.setMonth(12);
        updatedDateTo.setDate(31);
        updatedDateTo.setFullYear(updatedDateTo.getFullYear() - 1);
      }

      const allProject$ =  this.getAllProjectsData(updatedDateFrom, updatedDateTo).pipe(
        tap(data => {
          Array.from(data).forEach(row => {
            const dt = new Date(row['modifyDate']);
            row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
  
          });
          this.allProjectsData = data;
        }));

        const myProject$ =  this.getMyProjectData(updatedDateFrom, updatedDateTo).pipe(
          tap(data => {
            Array.from(data).forEach(row => {
              const dt = new Date(row['modifyDate']);
              row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
    
            });
            this.myProjectsData = data;
          }));
       
      forkJoin(allProject$, myProject$).subscribe(null, null, () => {

        if (this.selectedListType === 'myProject'){
          this.currentProjectData = this.myProjectsData;
          this.searchFilterMetric();
        }
        else {
          this.currentProjectData = this.allProjectsData;
          this.searchFilterMetric();
        }

      });    
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
      const locData = this.impGeofootprintLocationService.get();
      if (locData.length > 0) {
        this.customDialogDisplay = true;
        this.loadEvent = event;
      } else {
        this.onLoadProject(event);
      }
    }

    private onLoadProject(event: { projectId: number }) : void {
      this.stateService.clearUserInterface();
      this.appProjectService.load(event.projectId).subscribe(
        null,
        err => {
          console.log('There was an error loading the project', err);
          this.messageService.showErrorNotification('Project Load', `There was an error loading Project ${event.projectId}`);
        },
        () => {
          const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'load' });
          this.usageService.createCounterMetric(usageMetricName, null, null);
          this.appTradeAreaService.zoomToTradeArea();
          const audiences = this.targetAudienceService.getAudiences();
          const mappedAudience = audiences.find(a => a.showOnMap === true);
          if (mappedAudience != null){
            this.targetAudienceService.applyAudienceSelection();
          }
        });
      this.stateService.setLoadDialogVisibility(false);
      this.selectedListType = 'myProject';
      this.customDialogDisplay = false;
    }

    public onSearch(event, count){
      //console.log('test:::::', event, 'count::::', count);
      //const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'search' });
      //const metricText  = `userFilter=${event}~timeFilter=${this.selectedTimeLine}`;
      //this.usageService.createCounterMetric(usageMetricName, metricText, count);
    }

    private searchFilterMetric(){
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'search' });
      const metricText  = `userFilter=${this.selectedListType}~timeFilter=${this.selectedTimeLine}`;
      this.usageService.createCounterMetric(usageMetricName, metricText, (this.currentProjectData != null) ? this.currentProjectData.length : 0);
    }

    public accept(){
      const impProject = this.stateService.currentProject$.getValue();
      let errorString = null;
      if (impProject.projectName == null || impProject.projectName == '')
        errorString = 'imPower Project Name is required';
      if (impProject.methAnalysis == null || impProject.methAnalysis == '')
        errorString  = errorString + '\n Analysis Level is required';
      if (errorString != null) {
        this.messageService.showErrorNotification('Error Saving Project', errorString);
        return;
      }
      let newProjectId: number;
      this.appProjectService.save(impProject, false).subscribe(
        result => newProjectId = result,
        err => {
          console.error('There was an error saving the project', err);
          this.messageService.showErrorNotification('Project Save', 'There was an error saving the project');
        },
        () => {
          const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'save' });
          this.usageService.createCounterMetric(usageMetricName, null, newProjectId);
          this.messageService.showSuccessNotification('Save Project', `Project ${newProjectId} was saved successfully`);
          this.onLoadProject(this.loadEvent);
        });
    }

    public reject() {
      this.onLoadProject(this.loadEvent);
    }

    onDialogHide() : void {
      this.stateService.setLoadDialogVisibility(false);
    }
  }
