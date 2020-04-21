import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { formatDateForFuse } from '@val/common';
import { ConfirmationPayload, ShowConfirmation, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { SelectItem } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, switchMap, take, takeUntil, tap, withLatestFrom } from 'rxjs/operators';
import { AppConfig } from '../../app.config';
import { AppStateService } from '../../services/app-state.service';
import { UserService } from '../../services/user.service';
import { LocalAppState } from '../../state/app.interfaces';
import { CloseExistingProjectDialog, DiscardThenLoadProject, SaveThenLoadProject } from '../../state/menu/menu.actions';
import { openExistingDialogFlag } from '../../state/menu/menu.selectors';
import { CreateProjectUsageMetric } from '../../state/usage/targeting-usage.actions';
import { RestDataService } from '../../val-modules/common/services/restdata.service';
import { ImpProject } from '../../val-modules/targeting/models/ImpProject';

type FilterType = 'myProject' | 'allProjects';
type TimeSpanType = 'sixMonths' | 'currentMonth' | 'fourWeeks' | 'threeMonths' | 'twelveMonths' | 'currentYear' | 'previousYear';
const timeSpanSortOrder: TimeSpanType[] = ['sixMonths', 'currentMonth', 'fourWeeks', 'threeMonths', 'twelveMonths', 'currentYear', 'previousYear'];
const timeSpanFriendlyNames: Record<TimeSpanType, string> = {
  sixMonths: 'Last 6 Months',
  currentMonth: 'Current Month',
  fourWeeks: 'Last 4 Weeks',
  threeMonths: 'Last 3 Months',
  twelveMonths: 'Last 12 Months',
  currentYear: 'Current Year',
  previousYear: 'Previous Year'
};

@Component({
  selector: 'val-project',
  templateUrl: './project.component.html',
  styleUrls: ['./project.component.scss']
})
export class ProjectComponent implements OnInit, OnDestroy {

  public get showDialog() : boolean {
    return this._showDialog;
  }

  public set showDialog(value: boolean) {
    this.onDialogHide(value);
    this._showDialog = value;
  }

  private readonly projectSearchUrl = 'v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange';
  private readonly cloneProjectUrl =  'v1/targeting/base/clone/cloneproject';

  private hasExistingData: boolean = false;
  private triggerDataRefresh$ = new Subject<void>();
  private destroyed$ = new Subject<void>();

  private _showDialog: boolean = false;

  public triggerDataFilter$ = new BehaviorSubject<FilterType>('myProject');
  public timeSpans: SelectItem[];
  public selectedTimeSpan: TimeSpanType;

  public allProjectData$: Observable<Partial<ImpProject>[]>;
  public currentProjectData$: Observable<Partial<ImpProject>[]>;
  public selectedRow: Partial<ImpProject> = null;
  public dataLength: number;

  public gettingData: boolean;

  public columnOptions: SelectItem[] = [];
  public selectedColumns: any[] = [];
  public allColumns: any[] = [
    { field: 'projectId',                header: 'imPower ID',           size: '11%' },
    { field: 'projectTrackerId',         header: 'Project Tracker ID',   size: '15%' },
    { field: 'projectName',              header: 'imPower Project Name', size: '24%' },
    { field: 'projectTrackerClientName', header: 'Client Name',          size: '20%' },
    { field: 'modifyUserLoginname',      header: 'Username',             size: '10%' },
    { field: 'modifyDate',               header: 'Last Modified Date',   size: '20%' }
  ];

  constructor(private restService: RestDataService,
              private userService: UserService,
              private stateService: AppStateService,
              private config: AppConfig,
              private store$: Store<LocalAppState>) {
    this.timeSpans = timeSpanSortOrder.map(ts => ({
      label: timeSpanFriendlyNames[ts],
      value: ts
    }));
    this.selectedTimeSpan = 'sixMonths';
    for (const column of this.allColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }
  }

  ngOnInit() {
    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
      take(1),
    ).subscribe(() => {
      this.allProjectData$ = this.triggerDataRefresh$.pipe(
        takeUntil(this.destroyed$),
        switchMap(() => this.getData())
      );
      this.currentProjectData$ = combineLatest([this.triggerDataFilter$, this.allProjectData$]).pipe(
        map(([filterType, data]) => {
          const result = filterType === 'myProject' ? data.filter(p => p.modifyUser === this.userService.getUser().userId) : data;
          return [filterType, result] as [FilterType, Partial<ImpProject>[]];
        }),
        tap(([filterType, data]) => this.recordMetrics(filterType, data.length)),
        map(([, data]) => data)
      );
      this.store$.select(openExistingDialogFlag).pipe(
        takeUntil(this.destroyed$),
        withLatestFrom(this.stateService.allLocationCount$)
      ).subscribe(([flag, locationCount]) => {
        this._showDialog = flag;
        this.hasExistingData = locationCount > 0;
        if (this._showDialog) this.triggerDataRefresh$.next();
      });
    });
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  private getData() : Observable<Partial<ImpProject>[]> {
    const dates = this.getDates();
    const query = `${this.projectSearchUrl}&&updatedDateFrom=${formatDateForFuse(dates.start)}&&updatedDateTo=${formatDateForFuse(dates.end)}`;
    this.gettingData = true;
    return this.restService.get(query).pipe(
      map((result) => result.payload.rows as Partial<ImpProject>[]),

    );
  }

  refreshData() : void {
    this.triggerDataRefresh$.next();
  }

  public onDoubleClick(data: { projectId: number }) {
    if (this.config.environmentName === 'DEV') {
      this.loadProject(data.projectId);
    }
  }

  public loadProject(projectId: number) {
    if (this.hasExistingData) {
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

  private recordMetrics(filterType: FilterType, dataLength: number) : void {
    this.dataLength = dataLength;
    const metricText  = `userFilter=${filterType}~timeFilter=${this.selectedTimeSpan}`;
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'search', metricText, dataLength));
    this.gettingData = false;
  }

  onDialogHide(newFlagValue: boolean) : void {
    if (newFlagValue === false && newFlagValue != this._showDialog) {
      // the field has changed from true to false
      this.store$.dispatch(new CloseExistingProjectDialog());
    }
  }

  public cloneProject(projectId: number){
    const payload = { 'projectId': projectId, 'userId' : this.userService.getUser().userId };
    const key = 'CLONE_PROJECT';
    this.store$.dispatch(new StartBusyIndicator({ key, message: `Cloning project ${projectId}`}));

    this.restService.post(this.cloneProjectUrl, payload).subscribe(() => {
      this.triggerDataRefresh$.next();
      this.store$.dispatch(new StopBusyIndicator({ key }));
    });
  }

  private getDates() : { start: Date, end: Date } {
    const start = new Date();
    const end = new Date();
    switch (this.selectedTimeSpan) {
      case 'sixMonths':
        start.setMonth(start.getMonth() - 6, 1);
        break;
      case 'currentMonth':
        start.setDate(1);
        end.setMonth(end.getMonth() + 1);
        end.setDate(0);
        break;
      case 'fourWeeks':
        start.setDate(start.getDate() - 28);
        break;
      case 'threeMonths':
        start.setMonth(start.getMonth() - 3, 1);
        break;
      case 'twelveMonths':
        start.setMonth(start.getMonth() - 12, 1);
        break;
      case 'currentYear':
        start.setMonth(0, 1);
        end.setMonth(11, 31);
        break;
      case 'previousYear':
        start.setFullYear(start.getFullYear() - 1, 0, 1);
        end.setFullYear(end.getFullYear() - 1, 11, 31);
        break;
    }
    // expand the date range by 1 day at the end
    // since we only send dates, and the DB uses date times
    // each date gets midnight appended to it for the query
    end.setDate(end.getDate() + 1);
    return { start, end };
  }
}
