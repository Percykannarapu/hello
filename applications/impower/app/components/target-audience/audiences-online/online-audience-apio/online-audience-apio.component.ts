import { Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { TreeNode } from 'primeng/api';
import { BehaviorSubject, Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import { ObservableWorker } from '../../../../../worker-shared/common/core-interfaces';
import { OnlineAudienceDefinition } from '../../../../../worker-shared/data-model/custom/treeview';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { TreeviewPayload, TreeViewResponse } from '../../../../../worker-shared/treeview-workers/payloads';
import { WorkerFactory } from '../../../../common/worker-factory';
import { OnlineSourceTypes } from '../../../../common/models/audience-enums';
import { createOnlineAudienceInstance } from '../../../../common/models/audience-factories';
import { UserService } from '../../../../services/user.service';

@Component({
  selector: 'val-online-audience-apio',
  templateUrl: './online-audience-apio.component.html',
})
export class OnlineAudienceApioComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();
  public selectedSource$ = new BehaviorSubject<OnlineSourceTypes>(OnlineSourceTypes.Interest);
  public brokers: ObservableWorker<TreeviewPayload, TreeViewResponse>[] = [];
  public selectedAudiences$ = this.store$.select(fromAudienceSelectors.getInterestAndMarketAudiences);
  public currentBrokerId: string;

  // enums have to be exposed like this so they are available in the template
  public SourceType = OnlineSourceTypes;

  private destroyed$ = new Subject<void>();
  private brokerMap = new Map<OnlineSourceTypes, ObservableWorker<TreeviewPayload, TreeViewResponse>>();

  public createAudience = (node: TreeNode<OnlineAudienceDefinition>) => createOnlineAudienceInstance(node.data.categoryName, `${node.data.digCategoryId}`, FieldContentTypeCodes.Index, this.selectedSource$.getValue());
  public getPk = (node: TreeNode<OnlineAudienceDefinition>) => node.data.digCategoryId;

  constructor(private appStateService: AppStateService,
              private store$: Store<LocalAppState>,
              private userService: UserService) {}

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    if (this.userService.userHasGrants(['VARIABLE_CATEGORY_INTEREST'])) {
      this.brokerMap.set(OnlineSourceTypes.Interest, WorkerFactory.createInterestTreeviewWorker());
      this.currentBrokerId = this.brokerMap.get(OnlineSourceTypes.Interest).workerId;
      this.selectedSource$.next(OnlineSourceTypes.Interest);
    }
    if (this.userService.userHasGrants(['VARIABLE_CATEGORY_INMARKET'])) {
      this.brokerMap.set(OnlineSourceTypes.InMarket, WorkerFactory.createInMarketTreeviewWorker());
      if (!this.brokerMap.has(OnlineSourceTypes.Interest)) {
        this.currentBrokerId = this.brokerMap.get(OnlineSourceTypes.InMarket).workerId;
        this.selectedSource$.next(OnlineSourceTypes.InMarket);
      }
    }
    this.brokers = Array.from(this.brokerMap.values());
    this.selectedSource$.pipe(
      takeUntil(this.destroyed$),
      filter(source => this.brokerMap.has(source))
    ).subscribe(source => this.currentBrokerId = this.brokerMap.get(source)?.workerId);

    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() =>  {
      this.selectedSource$.next(OnlineSourceTypes.Interest);
    });
  }
}
