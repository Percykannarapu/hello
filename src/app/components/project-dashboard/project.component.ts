import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { UserService } from '../../services/user.service';
import { AppProjectService } from '../../services/app-project.service';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { calculateStatistics } from '../../app.utils';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { AppLocationService } from '../../services/app-location.service';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { Observable, Subscription, combineLatest } from 'rxjs';
import { filter, take, map } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';


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
    public selectedRow;


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
                private usageService: UsageService){

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
    public selectedListType: 'Myproject' | 'Allproject';
    public selectedColumns: any[] = [];
    public columnOptions: SelectItem[] = [];
    public projectColumns: string[];
    public currentProjectData: any[] = [];
    public selectedProjectData: any[] = [];

    ngOnInit() {
      this.selectedListType = 'Myproject';

      for (const column of this.allColumns) {
        this.columnOptions.push({ label: column.header, value: column });
        this.selectedColumns.push(column);
      }

    }

    ngAfterViewInit(){
      this.selectedListType = 'Myproject';
      const usrSub = this.userService.userObservable.subscribe(result => {
        if (result.userId != null){
          this.overlaySub = this.appProjectService.getngDialogObs().subscribe(bool => {
            this.display = bool;
              const updatedateFrom = this.todayDate;
              const updatedDateTo = new Date();
              updatedateFrom.setMonth(updatedateFrom.getMonth() - 6);

              const sub = this.getAllProjectsData(updatedateFrom, updatedDateTo).subscribe(data => {
                Array.from(data).forEach(row => {
                  const dt = new Date(row['modifyDate']);
                  row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
                });
                this.allProjectsData = data;
              });

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

    public onListTypeChange(data: 'Myproject' | 'Allproject') {
      this.selectedListType = data;
      if (this.selectedListType === 'Myproject'){
          this.currentProjectData = this.myProjecctsData;
      }
      else {
        this.currentProjectData = this.allProjectsData;
      }
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

      const sub = this.getAllProjectsData(updatedateFrom, updatedDateTo).subscribe(data => {
        Array.from(data).forEach(row => {
          const dt = new Date(row['modifyDate']);
          row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();

        });
        this.allProjectsData = data;
      }, null , () => {
        if (this.selectedListType === 'Myproject'){
          this.currentProjectData = this.myProjecctsData;
        }
        else {
          this.currentProjectData = this.allProjectsData;
        }
      });

      const sub1 = this.getMyProjectData(updatedateFrom, updatedDateTo).subscribe(data => {
        Array.from(data).forEach(row => {
          const dt = new Date(row['modifyDate']);
          row['modifyDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();

        });
        this.myProjecctsData = data;
        this.currentProjectData = this.myProjecctsData;
      }, null, () => {
        if (this.selectedListType === 'Myproject'){
          this.currentProjectData = this.myProjecctsData;
        }
        else {
          this.currentProjectData = this.allProjectsData;
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
      this.stateService.loadProject(event.projectId).subscribe(project => this.onLoadProject(project));
      this.display = false;
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'load' });
      this.usageService.createCounterMetric(usageMetricName, null, null);
    }

    private onLoadProject(project: ImpProject) : void {
      const locData = this.impGeofootprintLocationService.get();
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
    }

    public onSearch(event, count){
      //console.log('test:::::', event, 'count::::', count);
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'project', target: 'project', action: 'search' });
      const metricText  = `userFilter=${event}~timeFilter=${this.selectedTimeLine}`;
      this.usageService.createCounterMetric(usageMetricName, metricText, count);
    }

    /*public reorderColumn(event){
      console.log('event fired for column alter');
      let i = 0;
        const newOrderedColumns = [];
        for (const col of this.selectedColumns){
            if (event.newValue == i) {
              newOrderedColumns.push(event.column);
              newOrderedColumns.push(col);
            }else if (event.prevValue == i) {

            }else {
              newOrderedColumns.push(col);
          }
          ++i;
        }
        this.selectedColumns = newOrderedColumns;
    }*/
  }
