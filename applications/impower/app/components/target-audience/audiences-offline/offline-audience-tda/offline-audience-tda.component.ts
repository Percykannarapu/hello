import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort } from '@val/common';
import { ShowSimpleMessageBox } from '@val/messaging';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { TreeNode } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, map, share, takeUntil } from 'rxjs/operators';
import { filterTreeNodesRecursive, treeNodeSortBuilder } from '../../../../common/treenode-utils';
import * as fromTda from '../../../../impower-datastore/state/transient/audience-definitions/tda/tda-audience.reducer';
import { DeleteAudience } from '../../../../impower-datastore/state/transient/audience/audience.actions';
import { OfflineAudienceDefinition } from '../../../../models/audience-categories.model';
import { AudienceDataDefinition } from '../../../../models/audience-data.model';
import { createOfflineAudienceInstance } from '../../../../models/audience-factories';
import { AppStateService } from '../../../../services/app-state.service';
import { UnifiedAudienceDefinitionService } from '../../../../services/unified-audience-definition.service';
import { UnifiedAudienceService } from '../../../../services/unified-audience.service';
import { LocalAppState } from '../../../../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../../../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';

@Component({
  selector: 'val-offline-audience-tda',
  templateUrl: './offline-audience-tda.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineAudienceTdaComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();

  public currentNodes$: Observable<TreeNode<OfflineAudienceDefinition>[]>;
  public selectedNodes$: Observable<TreeNode<OfflineAudienceDefinition>[]>;

  public loading$: Observable<boolean>;
  public searchTerm$: Subject<string> = new BehaviorSubject<string>(null);
  private destroyed$ = new Subject<void>();
  private selectedReset$ = new BehaviorSubject<void>(null);

  constructor(private appStateService: AppStateService,
              private logger: LoggingService,
              private store$: Store<LocalAppState>,
              private definitionService: UnifiedAudienceDefinitionService,
              private audienceService: UnifiedAudienceService) {}

  private static asFolder(category: OfflineAudienceDefinition) : TreeNode<OfflineAudienceDefinition> {
    return {
      label: category.displayName,
      data: category,
      expandedIcon: 'pi pi-folder-open',
      collapsedIcon: 'pi pi-folder',
      leaf: false,
      selectable: false,
      key: category.identifier,
      children: category.children.map(child => this.asLeaf(child))
    };
  }

  private static asLeaf(variable: OfflineAudienceDefinition) : TreeNode<OfflineAudienceDefinition> {
    return {
      label: variable.displayName,
      data: variable,
      icon: 'pi pi-file-o',
      leaf: true,
      key: variable.identifier
    };
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.loading$ = this.store$.select(fromTda.fetchComplete).pipe(
      takeUntil(this.destroyed$),
      map(result => !result)
    );
    const nodes$ = this.definitionService.getTdaDefinitions().pipe(
      map(definitions => {
        const nodes = definitions.filter(d => d.children.length > 0).map(d => OfflineAudienceTdaComponent.asFolder(d));
        nodes.sort(treeNodeSortBuilder(n => n.data.sortOrder, CommonSort.GenericNumber));
        return nodes;
      }),
      share()
    );
    const textFilter$ = this.searchTerm$.pipe(debounceTime(250));
    this.currentNodes$ = combineLatest([textFilter$, nodes$]).pipe(
      takeUntil(this.destroyed$),
      map(([term, nodes]) => filterTreeNodesRecursive(term, nodes, n => n.label + ' ' + n.data.additionalSearchField)),
    );

    this.selectedNodes$ = combineLatest([this.store$.select(fromAudienceSelectors.getTdaAudiences), nodes$, this.selectedReset$]).pipe(
      takeUntil(this.destroyed$),
      map(([selected]) => selected.map(s => ({ key: s.audienceIdentifier }))),
    );

    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() =>  this.searchTerm$.next(''));
  }

  public selectVariable(event: TreeNode<OfflineAudienceDefinition>) {
    const model = createOfflineAudienceInstance(event.data.displayName, event.data.identifier, event.data.fieldconte);
    this.usageMetricCheckUncheckOffline(true, model);
    this.audienceService.addAudience(model);
  }

  public removeVariable(event: TreeNode<OfflineAudienceDefinition>) : void {
    const isDependent = this.reservedAudienceIds.has(Number(event.key));
    if (isDependent) {
      const header = 'Invalid Delete';
      const message = 'Audiences used to create a Combined, Converted, or Composite Audience can not be deleted.';
      this.store$.dispatch(new ShowSimpleMessageBox({ message, header }));
      this.selectedReset$.next();
    } else {
      this.store$.dispatch(new DeleteAudience({ id: event.data.identifier }));
      const model = createOfflineAudienceInstance(event.data.displayName, event.data.identifier, event.data.fieldconte);
      this.usageMetricCheckUncheckOffline(false, model);
    }
  }

  public trackByKey(index: number, node: TreeNode<OfflineAudienceDefinition>) : string {
    return node.key;
  }

  private usageMetricCheckUncheckOffline(isChecked: boolean, audience: AudienceDataDefinition) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const metricText = audience.audienceIdentifier + '~' + audience.audienceName  + '~' + audience.audienceSourceName + '~' + audience.audienceSourceType + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('offline', isChecked ? 'checked' : 'unchecked', metricText));
  }
}
