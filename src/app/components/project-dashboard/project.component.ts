import { Component, OnInit, ViewChild } from '@angular/core';
import { ConfirmationService, SelectItem, OverlayPanel } from 'primeng/primeng';
import { Observable } from 'rxjs/internal/Observable';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { map } from 'rxjs/internal/operators/map';
import { UserService } from '../../services/user.service';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';
import { ImpProjectService } from '../../val-modules/targeting/services/ImpProject.service';
//import { Router } from '@angular/router';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';
import { AppProjectService } from '../../services/app-project.service';
import { Subscription } from 'rxjs/Subscription';
import { AfterViewInit } from '@angular/core/src/metadata/lifecycle_hooks';




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
                public  impProjectService: ImpProjectService,
                private userService: UserService, 
                public  appProjectService: AppProjectService,
                ){

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
               
    }

    public allColumns: any[] = [
     // { field: '',                     header: 'Select',                        size: '60px'},
      { field: 'projectId',            header: 'imPower ID',                    size: '1px'},
      { field: 'projectTrakerId',      header: 'Project Tracker ID',            size: '50px'},
      { field: 'projectName',          header: 'imPower Project Name',          size: '500px'},
      { field: 'clientname',           header: 'Client Name',                   size: '30px'},
      { field: 'userNmae',             header: 'Username',                      size: '40px'},
      { field: 'modifiedDate',         header: 'Last Modified Date',            size: '40px'}
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
      console.log('test project component:::'); 
     // this.myProjecctsData = [];
      
      for (const column of this.allColumns) {
        this.columnOptions.push({ label: column.header, value: column });
        this.selectedColumns.push(column);
      }
      
    }

    ngAfterViewInit(){
      this.overlaySub = this.appProjectService.getngDialogObs().subscribe(result => {
        this.display = result;
          const updatedateFrom = this.todayDate;
          const updatedDateTo = new Date();
          updatedateFrom.setMonth(updatedateFrom.getMonth() - 6);
          updatedateFrom.setDate(updatedateFrom.getDate() - 1);
          updatedDateTo.setDate(updatedDateTo.getDate() + 1);
          const sub = this.getAllProjectsData(updatedateFrom, updatedDateTo).subscribe(data => {
            Array.from(data).forEach(row => {
              const dt = new Date(row['modifiedDate']);
              row['modifiedDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
            });
            this.allProjectsData = data;
          });

          const sub1 = this.getMyProjectData(updatedateFrom, updatedDateTo).subscribe(data => {
            Array.from(data).forEach(row => {
              const dt = new Date(row['modifiedDate']);
              row['modifiedDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
            });
            this.myProjecctsData = data;
            this.currentProjectData = this.myProjecctsData;
          });
        }); 
    }

    public getAllProjectsData(updatedDateFrom, updatedDateTo) : Observable<any>{
      updatedDateFrom = this.formatDate(updatedDateFrom);
      updatedDateTo = this.formatDate(updatedDateTo);
      return this.restService.get(`v1/targeting/base/impproject/search?q=impprojectdtls&&updatedDateFrom=${updatedDateFrom}&&updatedDateTo=${updatedDateTo}`).pipe(
        map((result: any) => result.payload.rows)
       );
    }

    public getMyProjectData(updatedDateFrom, updatedDateTo) : Observable<any>{
      let data: any[] = [];
      updatedDateFrom = this.formatDate(updatedDateFrom);
      updatedDateTo = this.formatDate(updatedDateTo);
     // console.log('url:::::', `v1/targeting/base/impproject/search?q=impproject&&createUser=${this.userService.getUser().userId}`);
      return this.restService.get(`v1/targeting/base/impproject/search?q=impprojectdtls&&createUser=${this.userService.getUser().userId}&&updatedDateFrom=${updatedDateFrom}&&updatedDateTo=${updatedDateTo}`).pipe(
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
      console.log('project:::::', event);
      this.selectedProjectData.push(event);
      
    }

    public onSelectTimeFrame(event: string){
      console.log('timeframe::::', event);
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

      const sub = this.getAllProjectsData(updatedateFrom, updatedDateTo).subscribe(data => {
        Array.from(data).forEach(row => {
          const dt = new Date(row['modifiedDate']);
          row['modifiedDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
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
          const dt = new Date(row['modifiedDate']);
          row['modifiedDate'] = dt.toLocaleDateString() + '  ' + dt.toLocaleTimeString();
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
      console.log('double click:::', event);
      this.impProjectService.loadProject(event.data['projectId'], true);
      this.display = false;
     
    }

    public loadProject(event){
      console.log('load click:::', event);
      this.impProjectService.loadProject(event['projectId'], true);
      this.display = false;
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