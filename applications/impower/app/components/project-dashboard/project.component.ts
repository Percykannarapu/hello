import {AfterViewInit, ChangeDetectorRef, Component, OnInit} from '@angular/core';
import {Store, select} from '@ngrx/store';
import {formatDateForFuse} from '@val/common';
import {ConfirmationPayload, ShowConfirmation} from '@val/messaging';
import {SelectItem} from 'primeng/api';
import {Observable, pipe} from 'rxjs';
import {filter, map, take, tap, switchMap} from 'rxjs/operators';
import {AppLocationService} from '../../services/app-location.service';
import {AppStateService} from '../../services/app-state.service';
import {AppTradeAreaService} from '../../services/app-trade-area.service';
import {TargetAudienceService} from '../../services/target-audience.service';
import {UserService} from '../../services/user.service';
import {LocalAppState} from '../../state/app.interfaces';
import {CloseExistingProjectDialog, DiscardThenLoadProject, SaveThenLoadProject} from '../../state/menu/menu.actions';
import {openExistingDialogFlag} from '../../state/menu/menu.selectors';
import {CreateProjectUsageMetric} from '../../state/usage/targeting-usage.actions';
import {RestDataService} from '../../val-modules/common/services/restdata.service';
import {ImpProject} from '../../val-modules/targeting/models/ImpProject';
import {ImpGeofootprintLocationService} from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';

@Component({
    selector: 'val-project',
    templateUrl: './project.component.html',
    styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, AfterViewInit {

    private readonly projectSearchUrl = 'v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange';
    private readonly cloneProjectUrl =  'v1/targeting/base/clone/cloneproject';
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
    public selectedRow;
    public allProjectsData: any;
    public myProjectsData: any;
    public selectedListType: 'myProject' | 'allProjects' = 'myProject';
    public selectedColumns: any[] = [];
    public columnOptions: SelectItem[] = [];
    public currentProjectData: any[] = [];

    public allColumns: any[] = [
        // { field: '',                     header: 'Select',                        size: '60px'},
        { field: 'projectId',                    header: 'imPower ID',                    size: '11%'},
        { field: 'projectTrackerId',             header: 'Project Tracker ID',            size: '15%'},
        { field: 'projectName',                  header: 'imPower Project Name',          size: '24%'},
        { field: 'projectTrackerClientName',     header: 'Client Name',                   size: '20%'},
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
              private store$: Store<LocalAppState>,
              private cd: ChangeDetectorRef) {

    this.timeLines = [
      {label: 'Last 6 Months',  value: 'sixMonths'},
      {label: 'Current Month',  value: 'currentMonth'},
      {label: 'Last 4 Weeks',   value: 'fourweeks'},
      {label: 'Last 3 Months',  value: 'threeMonths'},
      {label: 'Last 12 Months', value: 'tweleMonths'},
      {label: 'Current Year',   value: 'currentYear'},
      {label: 'Previous Year',  value: 'previousYear'}
    ];
    for (const column of this.allColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }
  }

  ngOnInit() {
    const updatedDateFrom = this.todayDate;
    const updatedDateTo = new Date();
    updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);

    this.store$.select(openExistingDialogFlag).pipe(
      tap(flag => {
        this.clearDialog(flag);
      }),
      switchMap(flag => flag ? this.getAllProjectsData(updatedDateFrom, updatedDateTo) : [])
    ).subscribe(data => {
      if (data.length > 0){
        this.onListTypeChange(this.selectedListType);
      }
    });
  }

  ngAfterViewInit() {
    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
      take(1)
    ).subscribe(() => {
      const updatedDateFrom = this.todayDate;
      const updatedDateTo = new Date();
      updatedDateFrom.setMonth(updatedDateFrom.getMonth() - 6);

      this.getAllProjectsData(updatedDateFrom, updatedDateTo).subscribe({ complete: () => this.onListTypeChange(this.selectedListType)});
    });
  }

  onFilter() {
    this.cd.markForCheck();
  }

  private getAllProjectsData(updatedDateFrom: Date, updatedDateTo: Date) : Observable<ImpProject[]>{
    updatedDateFrom.setDate(updatedDateFrom.getDate() - 1);
    updatedDateTo.setDate(updatedDateTo.getDate() + 1);
    const searchQuery = `${this.projectSearchUrl}&&updatedDateFrom=${formatDateForFuse(updatedDateFrom)}&&updatedDateTo=${formatDateForFuse(updatedDateTo)}`;
    return this.restService.get(searchQuery).pipe(
      map((result: any) => result.payload.rows as ImpProject[]),
      tap(data => this.allProjectsData = data),
      tap(data => this.myProjectsData = data.filter(p => p.modifyUser === this.userService.getUser().userId))
     );
  }

  onListTypeChange(data: 'myProject' | 'allProjects') {
    this.selectedListType = data;

    if (this.selectedListType === 'myProject'){
        this.currentProjectData = this.myProjectsData;
    } else {
      this.currentProjectData = this.allProjectsData;
    }
    this.cd.markForCheck();
    this.searchFilterMetric();
  }

  onSelectTimeFrame(event: string){
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

    this.getAllProjectsData(updatedDateFrom, updatedDateTo).subscribe({ complete: () => this.onListTypeChange(this.selectedListType)});
  }

  // public onDoubleClick(data: { projectId: number }) {
  //    this.loadProject(data.projectId);
  // }

  public loadProject(projectId: number) {
    const locData = this.impGeofootprintLocationService.get();
    if (locData.length > 0) {
      const payload: ConfirmationPayload = {
        title: 'Save Work',
        message: 'Would you like to save your work before proceeding?',
        canBeClosed: true,
        accept: {
          result: new SaveThenLoadProject({ projectToLoad: projectId })
        },
        reject: {
          result: new DiscardThenLoadProject({ projectToLoad: projectId })
        }
      };
      this.store$.dispatch(new ShowConfirmation(payload));
    } else {
      this.store$.dispatch(new DiscardThenLoadProject({ projectToLoad: projectId }));
    }
  }

  private searchFilterMetric(){
    const metricText  = `userFilter=${this.selectedListType}~timeFilter=${this.selectedTimeLine}`;
    const searchResultLength = this.currentProjectData != null ? this.currentProjectData.length : 0;
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'search', metricText, searchResultLength));
  }

  onDialogHide() : void {
    this.store$.dispatch(new CloseExistingProjectDialog());
  }

  private clearDialog(flag: boolean){
    this.currentProjectData = [];
    this.myProjectsData = [];
    this.allProjectsData = [];
    this._showDialog = flag;

  }

  public cloneProject(projectId:any){
    const payload = {'projectId': projectId, 'userId' : this.userService.getUser().userId};
      this.restService.post(this.cloneProjectUrl, payload).subscribe(response => {
          console.log('response===>', response);
     })
  }
}
