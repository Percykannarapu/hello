import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { UserService } from '../../services/user.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { AppLocationService } from '../../services/app-location.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { Observable, forkJoin } from 'rxjs';
import { filter, map, tap } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { TargetAudienceService } from '../../services/target-audience.service';
import { select, Store } from '@ngrx/store';
import { LocalAppState } from '../../state/app.interfaces';
import { ShowConfirmation } from '../../messaging';
import { openExistingDialogFlag } from '../../state/menu/menu.reducer';
import { CreateProjectUsageMetric } from '../../state/usage/targeting-usage.actions';
import { ConfirmationPayload } from '../../messaging/state/confirmation/confirmation.actions';
import { CloseExistingProjectDialog, DiscardThenLoadProject, SaveThenLoadProject } from '../../state/menu/menu.actions';

@Component({
    selector: 'val-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.css']
})
export class ProjectComponent implements OnInit, AfterViewInit {

    private _showDialog: boolean = false;

    // This is a workaround for a PrimeNg bug where dialogs aren't firing onHide() properly
    public get showDialog() : boolean { return this._showDialog; }
    public set showDialog(newValue: boolean) {
      if (newValue !== this._showDialog && newValue === false) {
        this.onDialogHide();
      }
      this._showDialog = newValue;
    }
    public timeLines;
    public selectedTimeLine = 'sixMonths';
    public todayDate = new Date();
    // public customDialogDisplay: boolean;
    public selectedRow;
    // public loadEvent: any;
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
                private impGeofootprintLocationService: ImpGeofootprintLocationService,
                private appLocationService: AppLocationService,
                private appTradeAreaService: AppTradeAreaService,
                private stateService: AppStateService,
                private targetAudienceService: TargetAudienceService,
                private store$: Store<LocalAppState>){

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
      this.store$.pipe(select(openExistingDialogFlag)).subscribe(flag => this._showDialog = flag);
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

    public dbClick(event: { originalEvent: MouseEvent, data: { projectId: number }}) {
       this.loadProject(event.data);
    }

    public loadProject(event: { projectId: number }){
      const locData = this.impGeofootprintLocationService.get();
      if (locData.length > 0) {
        const payload: ConfirmationPayload = {
          title: 'Save Work',
          message: 'Would you like to save your work before proceeding?',
          canBeClosed: true,
          accept: {
            result: new SaveThenLoadProject({ projectToLoad: event.projectId })
          },
          reject: {
            result: new DiscardThenLoadProject({ projectToLoad: event.projectId })
          }
        };
        this.store$.dispatch(new ShowConfirmation(payload));
      } else {
        this.store$.dispatch(new DiscardThenLoadProject({ projectToLoad: event.projectId }));
      }
    }

    public onSearch(event, count){
      //console.log('test:::::', event, 'count::::', count);
      //const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'search' });
      //const metricText  = `userFilter=${event}~timeFilter=${this.selectedTimeLine}`;
      //this.usageService.createCounterMetric(usageMetricName, metricText, count);
    }

    private searchFilterMetric(){
      const metricText  = `userFilter=${this.selectedListType}~timeFilter=${this.selectedTimeLine}`;
      const searchResultLength = this.currentProjectData != null ? this.currentProjectData.length : 0;
      this.store$.dispatch(new CreateProjectUsageMetric('project', 'search', metricText, searchResultLength));
    }

    onDialogHide() : void {
      this.store$.dispatch(new CloseExistingProjectDialog());
    }
  }
