import { Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { formatDateForFuse } from '@val/common';
import { MessageBoxService, StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { PrimeIcons, SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { BehaviorSubject, combineLatest, interval, Observable, Subscription } from 'rxjs';
import { filter, map, startWith, switchMap, tap } from 'rxjs/operators';
import { RestPayload } from '../../../../worker-shared/data-model/core.interfaces';
import { AppConfig } from '../../../app.config';
import { User } from '../../../models/User';
import { LocalAppState } from '../../../state/app.interfaces';
import { CreateProjectUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { RestDataService } from '../../../val-modules/common/services/restdata.service';
import { ImpProject } from '../../../val-modules/targeting/models/ImpProject';

export interface ExistingProjectResponse {
  projectToLoad: number;
  saveFirst: boolean;
}

type FilterType = 'myProject' | 'allProjects';
type TimeSpanType = 'sixMonths' | 'currentMonth' | 'fourWeeks' | 'threeMonths' | 'twelveMonths' | 'currentYear' | 'previousYear';
const timeSpanSortOrder: TimeSpanType[] = ['currentMonth', 'fourWeeks', 'threeMonths', 'sixMonths', 'twelveMonths', 'currentYear', 'previousYear'];
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
  templateUrl: './existing-project.component.html'
})
export class ExistingProjectComponent implements OnInit, OnDestroy {

  private readonly projectSearchUrl = 'v1/targeting/base/impprojectsview/search?q=impProjectsByDateRange';
  private readonly cloneProjectUrl =  'v1/targeting/base/clone/cloneproject';
  private readonly deActivateProjectUrl = 'v1/targeting/base/deactivate/project/';

  private hasExistingData: boolean = false;
  private triggerDataRefresh$ = new BehaviorSubject<void>(null);
  private currentUser: User;

  public selectedListType$ = new BehaviorSubject<FilterType>('myProject');
  public timeSpans: SelectItem[];
  public selectedTimeSpan$ = new BehaviorSubject<TimeSpanType>('threeMonths');
  public currentProjectData$: Observable<Partial<ImpProject>[]>;
  public selectedRow: Partial<ImpProject> = null;
  public dataLength: number;

  public isFetching = true;
  private fetchingMyData = true;
  private fetchingAllData = true;
  private mustForceRefresh = true;
  private myProjectsReadyToRefresh = true;
  private allProjectsReadyToRefresh = true;
  private projectSubscriptions = new Subscription();

  public allColumns: any[] = [
    // @formatter:off
    { field: 'projectId',            header: 'imPower ID',           size: '11%' },
    { field: 'projectTrackerId',     header: 'Project Tracker ID',   size: '15%' },
    { field: 'projectName',          header: 'imPower Project Name', size: '24%' },
    { field: 'clientIdentifierName', header: 'Client Name',          size: '20%' },
    { field: 'modifyUserLoginname',  header: 'Username',             size: '10%' },
    { field: 'modifyDate',           header: 'Last Modified Date',   size: '20%' }
    // @formatter:on
  ];

  public trackByProjectId = (index: number, project: ImpProject) => project.projectId;

  constructor(private ddConfig: DynamicDialogConfig,
              private ddRef: DynamicDialogRef,
              private restService: RestDataService,
              private config: AppConfig,
              private store$: Store<LocalAppState>,
              private messageService: MessageBoxService) {
    this.timeSpans = timeSpanSortOrder.map(ts => ({
      label: timeSpanFriendlyNames[ts],
      value: ts
    }));
  }

  public ngOnInit() {
    const fiveMinutes = 1000 * 60 * 5;
    this.currentUser = this.ddConfig.data.user;
    this.hasExistingData = this.ddConfig.data.hasExistingData;
    const timerSub = interval(fiveMinutes).subscribe(() => {
      this.myProjectsReadyToRefresh = true;
      this.allProjectsReadyToRefresh = true;
    });
    const fetchUpdateSub = this.selectedListType$.subscribe(() => this.updateFetchStatus());
    this.projectSubscriptions.add(timerSub);
    this.projectSubscriptions.add(fetchUpdateSub);

    const myProjectList$ = combineLatest([this.selectedTimeSpan$, this.selectedListType$, this.triggerDataRefresh$]).pipe(
      filter(([, listType]) => (listType === 'myProject' && this.myProjectsReadyToRefresh && !this.fetchingMyData) || this.mustForceRefresh),
      tap(() => {
        this.fetchingMyData = true;
        this.updateFetchStatus();
      }),
      switchMap(([timeSpan]) => this.getData(timeSpan, true)),
      tap(() => setTimeout(() => {
        this.myProjectsReadyToRefresh = false;
        this.fetchingMyData = false;
        this.updateFetchStatus();
      })),
      startWith([])
    );
    const allProjectList$ = combineLatest([this.selectedTimeSpan$, this.selectedListType$, this.triggerDataRefresh$]).pipe(
      filter(([, listType]) => (listType === 'allProjects' && this.allProjectsReadyToRefresh && !this.fetchingAllData) || this.mustForceRefresh),
      tap(() => {
        this.fetchingAllData = true;
        this.updateFetchStatus();
      }),
      switchMap(([timeSpan]) => this.getData(timeSpan, false)),
      tap(() => setTimeout(() => {
        this.allProjectsReadyToRefresh = false;
        this.fetchingAllData = false;
        this.updateFetchStatus();
      })),
      startWith([])
    );

    this.currentProjectData$ = combineLatest([this.selectedListType$, myProjectList$, allProjectList$]).pipe(
      map(([listType, myProjects, allProjects]) => [listType, (listType === 'myProject' ? myProjects : allProjects)] as const),
      tap(([filterType, data]) => this.recordMetrics(filterType, data.length)),
      tap(([, data]) => setTimeout(() => {
        this.mustForceRefresh = false;
        this.dataLength = data.length;
      })),
      map(([, data]) => data)
    );
  }

  public ngOnDestroy() {
    this.projectSubscriptions.unsubscribe();
  }

  public forceRefresh() : void {
    this.mustForceRefresh = true;
    this.triggerDataRefresh$.next();
  }

  public onDoubleClick(data: { projectId: number }, event: MouseEvent) {
    if (this.config.environmentName === 'DEV') {
      event.preventDefault();
      event.stopPropagation();
      this.loadProject(data.projectId);
    }
  }

  public loadProject(projectId: number) {
    if (this.hasExistingData) {
      this.messageService.showTwoButtonModal('Would you like to save your work before proceeding?', 'Save Work', PrimeIcons.QUESTION_CIRCLE, 'Yes', 'No')
        .subscribe(result => {
          if (result) {
            this.ddRef.close({ saveFirst: true, projectToLoad: projectId } as ExistingProjectResponse);
          } else {
            this.ddRef.close({ saveFirst: false, projectToLoad: projectId } as ExistingProjectResponse);
          }
        });
    } else {
      this.ddRef.close({ saveFirst: false, projectToLoad: projectId } as ExistingProjectResponse);
    }
  }

  public cloneProject(projectId: number) {
    const payload = { 'projectId': projectId, 'userId' : this.currentUser.userId };
    const key = 'CLONE_PROJECT';
    this.store$.dispatch(new StartBusyIndicator({ key, message: `Cloning project ${projectId}`}));

    this.restService.post(this.cloneProjectUrl, payload).subscribe(() => {
      this.forceRefresh();
      this.store$.dispatch(new StopBusyIndicator({ key }));
    });
  }

  public deActivateProject(projectId: number) {
    this.messageService.showDeleteConfirmModal('Are you sure you want to remove this project?').subscribe(result => {
      if (result) {
        const key = 'DEACTIVATE_PROJECT';
        this.store$.dispatch(new StartBusyIndicator({ key, message: `Deactivating project ${projectId}` }));
        this.restService.delete(this.deActivateProjectUrl, projectId).subscribe(() => {
          this.forceRefresh();
          this.store$.dispatch(new StopBusyIndicator({ key }));
        });
      }
    });
  }

  private updateFetchStatus() {
    this.isFetching = (this.fetchingMyData && this.selectedListType$.getValue() === 'myProject')
                     || (this.fetchingAllData && this.selectedListType$.getValue() === 'allProjects');
  }

  private getData(timeSpan: TimeSpanType, includeUserFilter: boolean) : Observable<Partial<ImpProject>[]> {
    const dates = this.getDates(timeSpan);
    let query = `${this.projectSearchUrl}&updatedDateFrom=${formatDateForFuse(dates.start)}&updatedDateTo=${formatDateForFuse(dates.end)}`;
    if (includeUserFilter) {
      query += `&modifyUser=${this.currentUser.userId}`;
    }
    return this.restService.get<RestPayload<Partial<ImpProject>>>(query).pipe(
      map((result) => result.payload.rows)
    );
  }

  private recordMetrics(filterType: FilterType, dataLength: number) : void {
    const metricText  = `userFilter=${filterType}~timeFilter=${this.selectedTimeSpan$.getValue()}`;
    this.store$.dispatch(new CreateProjectUsageMetric('project', 'search', metricText, dataLength));
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
