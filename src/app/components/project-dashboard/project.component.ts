import { Component, OnInit } from '@angular/core';
import { SelectItem } from 'primeng/primeng';
import { Observable } from 'rxjs/internal/Observable';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/internal/operators/map';
import { UserService } from '../../services/user.service';
import { AppProjectService } from '../../services/app-project.service';
import { Subscription } from 'rxjs/Subscription';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';
import { ImpGeofootprintGeoService } from '../../val-modules/targeting/services/ImpGeofootprintGeo.service';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { calculateStatistics } from '../../app.utils';
import { EsriMapService } from '../../esri-modules/core/esri-map.service';
import { AppLocationService } from '../../services/app-location.service';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { concat } from 'rxjs';
import { ImpGeofootprintTradeArea } from '../../val-modules/targeting/models/ImpGeofootprintTradeArea';
import { ImpGeofootprintTradeAreaService } from '../../val-modules/targeting/services/ImpGeofootprintTradeArea.service';
import { AppTradeAreaService } from '../../services/app-trade-area.service';
import { filter, take } from 'rxjs/operators';
import { AppStateService } from '../../services/app-state.service';


@Component({
    selector: 'val-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.css']
  })
  export class ProjectComponent implements OnInit, AfterViewInit {

    public timeLines;
    public selectedTimeLine ;
    public todayDate = new Date();
    public display: boolean;
    public selectedRow;


    overlaySub: Subscription;

    constructor(private restService: RestDataService,
                private userService: UserService,
                public  appProjectService: AppProjectService,
                private impProjectService: ImpProjectService,
                public  impGeofootprintGeoService: ImpGeofootprintGeoService,
                private impGeofootprintLocationService: ImpGeofootprintLocationService,
                private esriMapService: EsriMapService,
                private appLocationService: AppLocationService,
                private impGeofootprintTradeArea: ImpGeofootprintTradeAreaService,
                private appTradeAreaService: AppTradeAreaService,
                private stateService: AppStateService){

                  this.timeLines = [
                    {label: 'Last 6 Months',  value: 'sixMonths'},
                    {label: 'Current Month',  value: 'currentMonth'},
                    {label: 'Last 4 Weeks',   value: 'fourweeks'},
                    {label: 'Last 3 Months',  value: 'threeMonths'},
                    {label: 'Last 12 Months', value: 'tweleMonths'},
                    {label: 'Current Year',   value: 'currentYear'},
                    {label: 'Previous Year',  value: 'previousYear'}
                ];


               // this.appProjectService.overlayPanel.subscribe(result => this.onShowOverlay(result));
              //  this.impProjectService.overlayPanel.subscribe(result => {
              //   console.log('result:::subscribe:::', result);
              //   this.onShowOverlay(result);
              //  });
              impProjectService.storeObservable.subscribe(projects => this.onloadProject(projects));

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

    public dbClick(event){
       // this.loadProject(event);
       this.impProjectService.loadProject(event.data['projectId'], true);
      this.display = false;

      /*this.appProjectService.loadProject(event.data['projectId'], true).subscribe((projects: ImpProject[]) => {
          console.log('project loaded');
          const loadedProject = new ImpProject(projects[0]);
          loadedProject.convertToModel();
          this.appProjectService.replace([loadedProject]);
          this.appProjectService.replace(projects);
      }, null, () => {
        const locData = this.impGeofootprintLocationService.get();
        this.appLocationService.zoomToLocations(locData);
        this.display = false;
      });*/
      //this.impProjectService.loadProject(event.data['projectId'], true);
      //this.display = false;

    }

    public loadProject(event){
      this.impProjectService.loadProject(event['projectId'], true);
      this.display = false;
    }

    private zoomToSites(){
      const locData = this.impGeofootprintLocationService.get();
      const xStats = calculateStatistics(locData.map(d => d.xcoord));
      const yStats = calculateStatistics(locData.map(d => d.ycoord));
      this.esriMapService.zoomOnMap(xStats, yStats, locData.length);
    }

    private onloadProject(project){
        const locData = this.impGeofootprintLocationService.get();
        const taData = this.impGeofootprintTradeArea.get ();
        if (taData != null) {
         this.stateService.uniqueIdentifiedGeocodes$.pipe(
          filter(geos => geos != null && geos.length > 0),
          take(1)
        ).subscribe (geos => {
         this.appTradeAreaService.zoomToTradeArea();
      });
        }
        else {this.appLocationService.zoomToLocations(locData);
        }
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
