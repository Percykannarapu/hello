import { ChangeDetectorRef, Component, Input, OnChanges, OnDestroy, OnInit, SimpleChanges, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { isEmpty, isNil } from '@val/common';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { map, startWith, takeUntil } from 'rxjs/operators';
import { ObservableWorker } from '../../../../worker-shared/common/core-interfaces';
import { ValassisTreeNode } from '../../../../worker-shared/data-model/custom/treeview';
import { TreeviewPayload, TreeViewResponse } from '../../../../worker-shared/treeview-workers/payloads';
import { isValidChange } from '../../../common/ui-helpers';
import { DeleteAudience } from '../../../impower-datastore/state/transient/audience/audience.actions';
import { Audience } from '../../../impower-datastore/state/transient/audience/audience.model';
import { AudienceDataDefinition } from '../../../common/models/audience-data.model';
import { User } from '../../../common/models/User';
import { AppStateService } from '../../../services/app-state.service';
import { UnifiedAudienceService } from '../../../services/unified-audience.service';
import { UserService } from '../../../services/user.service';
import { LocalAppState } from '../../../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { SearchInputComponent } from '../search-input/search-input.component';

@Component({
  selector: 'val-brokered-treeview',
  templateUrl: './brokered-treeview.component.html'
})
export class BrokeredTreeviewComponent implements OnInit, OnDestroy, OnChanges {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();
  @Input() audienceGenerator: (node: ValassisTreeNode) => AudienceDataDefinition;
  @Input() audiencePkGetter: (node: ValassisTreeNode) => number;
  @Input() brokers: ObservableWorker<TreeviewPayload, TreeViewResponse>[];
  @Input() selectedAudiences$: Observable<Audience[]>;
  @Input() currentBrokerId: string;
  @Input() showFolderCheckbox: boolean;
  @Input() scrollHeight: string = '25vh';

  @ViewChild('searchInput', {static: true}) searchInput: SearchInputComponent;
  public includeFolder$ = new BehaviorSubject(false);
  public currentNodes: ValassisTreeNode[];
  public selectedNodes$: Observable<ValassisTreeNode[]>;
  public loading = true;

  private destroyed$ = new Subject<void>();
  private nodeMap: Record<string, ValassisTreeNode> = {};
  private brokerResultMap: Record<string, ValassisTreeNode[]> = {};
  private currentUser: User;

  public trackByKey = (index: number, node: ValassisTreeNode) => node.key;

  constructor(private appStateService: AppStateService,
              private audienceService: UnifiedAudienceService,
              private userService: UserService,
              private cd: ChangeDetectorRef,
              private logger: LoggingService,
              private store$: Store<LocalAppState>) {
  }

  public ngOnDestroy() : void {
    this.destroyed$.next();
  }

  ngOnInit() : void {
    if (isNil(this.audienceGenerator)) throw new Error('audienceGenerator is not set in Brokered Treeview component.');
    if (isNil(this.audiencePkGetter)) throw new Error('audiencePkGetter is not set in Brokered Treeview component.');
    if (isEmpty(this.brokers)) throw new Error('No broker is set in Brokered Treeview component.');

    this.currentUser = this.userService.getUser();

    const initialPayload = this.createWorkerPayload(null, false, null, false, true);
    this.brokers.forEach(broker => {
      broker.start(initialPayload).pipe(
        takeUntil(this.destroyed$),
      ).subscribe(result => {
        this.updateTreeView(result.value, broker.workerId);
      });
    });

    this.includeFolder$.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      const currentSearchTerm = this.searchInput.getValue();
      if (!isEmpty(currentSearchTerm)) {
        this.onSearch(currentSearchTerm);
      }
    });

    this.selectedNodes$ = this.selectedAudiences$.pipe(
      takeUntil(this.destroyed$),
      map(selected => selected.map(s => ({ key: s.audienceIdentifier }))),
      startWith([])
    );

    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() =>  {
      this.searchInput.reset();
      this.includeFolder$.next(false);
    });
  }

  public ngOnChanges(changes: SimpleChanges) : void {
    if (isValidChange(changes.currentBrokerId) || isValidChange(changes.reservedAudienceIds)) {
      this.updateCurrentNodes();
    }
  }

  public onSearch(term: string) : void {
    if (!this.loading) {
      const payload = this.createWorkerPayload(term, this.includeFolder$.getValue(), null);
      this.brokers.forEach(broker => {
        broker.sendNewMessage(payload);
      });
    }
  }

  public forceRefresh() : void {
    this.loading = true;
    this.currentNodes = [];
    this.searchInput.reset();
    this.includeFolder$.next(false);
    this.nodeMap = {};
    this.brokerResultMap = {};
    const payload = this.createWorkerPayload(null, false, null, true);
    this.brokers.forEach(broker => {
      broker.sendNewMessage(payload);
    });
  }

  public nodeSelect(event: ValassisTreeNode) {
    const model = this.audienceGenerator(event);
    this.generateMetric(true, model);
    this.audienceService.addAudience(model);
  }

  public nodeDeselect(event: ValassisTreeNode) : void {
    const nodePk = this.audiencePkGetter(event);
    this.store$.dispatch(new DeleteAudience({ id: `${nodePk}` }));
    const model = this.audienceGenerator(event);
    this.generateMetric(false, model);
  }

  public openNode(node: ValassisTreeNode) : void {
    if (isEmpty(node.children)) {
      const nodePk = this.audiencePkGetter(node);
      this.nodeMap[`${nodePk}`] = node;
      const payload = this.createWorkerPayload(this.searchInput.getValue(), this.includeFolder$.getValue(), nodePk);
      const currentBroker = this.brokers.filter(broker => broker.workerId === this.currentBrokerId);
      if (isEmpty(currentBroker)) {
        this.logger.error.log('Current Broker Id is not set correctly');
      } else {
        currentBroker[0].sendNewMessage(payload);
      }
    }
  }

  public closeNode(node: ValassisTreeNode) : void {
    node.children = [];
    this.cd.markForCheck();
  }

  private updateTreeView(data: TreeViewResponse, brokerId: string) : void {
    if (isNil(data.rootId)) {
      this.loading = false;
      this.brokerResultMap[brokerId] = data.nodes;
      this.updateCurrentNodes();
    } else {
      const currentNode = this.nodeMap[`${data.rootId}`];
      if (currentNode) {
        currentNode.children = data.nodes;
        delete this.nodeMap[`${data.rootId}`];
      }
    }
    this.cd.markForCheck();
  }

  private updateCurrentNodes() : void {
    const nodes = this.brokerResultMap[this.currentBrokerId] ?? [];
    this.updateNodeReservation(nodes);
    this.currentNodes = nodes;
  }

  private updateNodeReservation(nodes: ValassisTreeNode[]) {
    nodes.forEach(node => {
      const nodePk = this.audiencePkGetter(node);
      if (this.reservedAudienceIds.has(nodePk)) {
        node.styleClass = 'val-protected-node';
        node.selectable = false;
        node.isReserved = true;
      }
      if (node.children?.length > 0) this.updateNodeReservation(node.children);
    });
  }

  private generateMetric(isChecked: boolean, audience: AudienceDataDefinition) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName.replace('~', ':')  + '~' + audience.audienceSourceName + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric(audience.audienceSourceType.toLowerCase(), isChecked ? 'checked' : 'unchecked', metricText));
  }

  private createWorkerPayload(searchTerm: string, includeFolder: boolean, rootId: number, forceRefresh: boolean = false, initPayload: boolean = false) : TreeviewPayload {
    return {
      fetchHeaders: {
        Authorization: this.currentUser.token
      },
      forceRefresh,
      searchTerm,
      rootId,
      includeFolder,
      initPayload
    };
  }
}
