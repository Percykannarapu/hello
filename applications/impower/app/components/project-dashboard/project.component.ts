import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { formatDateForFuse } from '@val/common';
import { ConfirmationPayload, ShowConfirmation, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { ConfirmationService, SelectItem } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { filter, map, shareReplay, switchMap, take, takeUntil, tap } from 'rxjs/operators';
import { ValassisTreeNode } from '../../../worker-shared/data-model/custom/treeview';
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
  templateUrl: './project.component.html'
})
export class ProjectComponent implements OnInit, OnDestroy {

  private readonly projectSearchUrl = 'v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange';
  private readonly cloneProjectUrl =  'v1/targeting/base/clone/cloneproject';
  private readonly deActivateProjectUrl = 'v1/targeting/base/deactivate/project/';

  private hasExistingData: boolean = false;
  private triggerDataRefresh$ = new Subject<void>();
  private destroyed$ = new Subject<void>();

  public dialogIsVisible$: Observable<boolean>;
  public triggerDataFilter$ = new BehaviorSubject<FilterType>('myProject');
  public timeSpans: SelectItem[];
  public selectedTimeSpan$ = new BehaviorSubject<TimeSpanType>('sixMonths');
  public currentProjectData$: Observable<Partial<ImpProject>[]>;
  public selectedRow: Partial<ImpProject> = null;
  public dataLength: number;

  public deleteButtonDisabled = false;

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

  public trackByProjectId = (index: number, project: ImpProject) => project.projectId;

  constructor(private restService: RestDataService,
              private userService: UserService,
              private stateService: AppStateService,
              private config: AppConfig,
              private store$: Store<LocalAppState>,
              private confirmationService: ConfirmationService) {
    this.timeSpans = timeSpanSortOrder.map(ts => ({
      label: timeSpanFriendlyNames[ts],
      value: ts
    }));
    for (const column of this.allColumns) {
      this.columnOptions.push({ label: column.header, value: column });
      this.selectedColumns.push(column);
    }
  }

  public ngOnInit() {
    this.dialogIsVisible$ = this.store$.select(openExistingDialogFlag);
    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
      take(1),
    ).subscribe(() => {
      this.stateService.allLocationCount$.pipe(
        takeUntil(this.destroyed$)
      ).subscribe(count => this.hasExistingData = count > 0);

      const allProjectData$ = combineLatest([this.selectedTimeSpan$, this.triggerDataRefresh$]).pipe(
        takeUntil(this.destroyed$),
        switchMap(([timeSpan]) => this.getData(timeSpan)),
        shareReplay()
      );

      this.currentProjectData$ = combineLatest([this.triggerDataFilter$, allProjectData$]).pipe(
        takeUntil(this.destroyed$),
        map(([filterType, data]) => {
          const result = filterType === 'myProject' ? data.filter(p => p.modifyUser === this.userService.getUser().userId && p.isActive) : data.filter(p => p.isActive);
          this.deleteButtonDisabled = filterType !== 'myProject';
          return [filterType, result] as [FilterType, Partial<ImpProject>[]];
        }),
        tap(([filterType, data]) => this.recordMetrics(filterType, data.length)),
        map(([, data]) => data)
      );
    });
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  public hideDialog() : void {
    this.store$.dispatch(new CloseExistingProjectDialog());
  }

  public refreshData() : void {
    this.triggerDataRefresh$.next();
  }

  public onDoubleClick(data: { projectId: number }, event: MouseEvent) {
    if (this.config.environmentName === 'DEV') {
      event.preventDefault();
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

  public cloneProject(projectId: number){
    const payload = { 'projectId': projectId, 'userId' : this.userService.getUser().userId };
    const key = 'CLONE_PROJECT';
    this.store$.dispatch(new StartBusyIndicator({ key, message: `Cloning project ${projectId}`}));

    this.restService.post(this.cloneProjectUrl, payload).subscribe(() => {
      this.refreshData();
      this.store$.dispatch(new StopBusyIndicator({ key }));
    });
  }

  deActivateProject(projectId: number){
    this.confirmationService.confirm({
         message: 'Are you sure you want to remove this project?',
         header: 'Delete Project',
         icon: 'pi pi-trash',
      accept: () => {
        const key = 'DEACTIVATE_PROJECT';
        this.store$.dispatch(new StartBusyIndicator({ key, message: `Deactivating project ${projectId}`}));
        this.restService.delete(this.deActivateProjectUrl, projectId).subscribe(() => {
          this.refreshData();
          this.store$.dispatch(new StopBusyIndicator({ key }));
        });
      }
    });
  }

  private getData(timeSpan: TimeSpanType) : Observable<Partial<ImpProject>[]> {
    const dates = this.getDates(timeSpan);
    const query = `${this.projectSearchUrl}&&updatedDateFrom=${formatDateForFuse(dates.start)}&&updatedDateTo=${formatDateForFuse(dates.end)}`;
    this.gettingData = true;
    return this.restService.get(query).pipe(
      map((result) => result.payload.rows as Partial<ImpProject>[]),
    );
  }

  private recordMetrics(filterType: FilterType, dataLength: number) : void {
    this.dataLength = dataLength;
    const metricText  = `userFilter=${filterType}~timeFilter=${this.selectedTimeSpan$.getValue()}`;
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'search', metricText, dataLength));
    this.gettingData = false;
  }

  private getDates(timeSpan: TimeSpanType) : { start: Date, end: Date } {
    const start = new Date();
    const end = new Date();
    switch (timeSpan) {
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
