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
import { OfflineAudienceDefinition } from '../../../../models/audience-categories.model';
import { AppStateService } from '../../../../services/app-state.service';
import { TargetAudienceTdaService } from '../../../../services/target-audience-tda.service';
import { TargetAudienceService } from '../../../../services/target-audience.service';
import { UnifiedAudienceDefinitionService } from '../../../../services/unified-audience-definition.service';
import { LocalAppState } from '../../../../state/app.interfaces';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';

@Component({
  selector: 'val-offline-audience-tda',
  templateUrl: './offline-audience-tda.component.html',
  styleUrls: ['./offline-audience-tda.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineAudienceTdaComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();

  public currentNodes$: Observable<TreeNode[]>;
  public selectedNodes$: Observable<TreeNode[]>;

  public loading$: Observable<boolean>;
  public searchTerm$: Subject<string> = new BehaviorSubject<string>(null);
  private destroyed$ = new Subject<void>();
  private selectedReset$ = new BehaviorSubject<void>(null);

  constructor(private audienceService: TargetAudienceTdaService,
              private parentAudienceService: TargetAudienceService,
              private definitionService: UnifiedAudienceDefinitionService,
              private appStateService: AppStateService,
              private logger: LoggingService,
              private store$: Store<LocalAppState>) {}

  private static asFolder(category: OfflineAudienceDefinition) : TreeNode {
    return {
      label: category.displayName,
      data: category,
      expandedIcon: 'fa fa-folder-open',
      collapsedIcon: 'fa fa-folder',
      leaf: false,
      selectable: false,
      key: category.identifier,
      children: category.children.map(child => this.asLeaf(child))
    };
  }

  private static asLeaf(variable: OfflineAudienceDefinition) : TreeNode {
    return {
      label: variable.displayName,
      data: variable,
      icon: 'fa fa-file-o',
      leaf: true,
      key: variable.identifier
    };
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  public ngOnInit() : void {
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
      map(([term, nodes]) => filterTreeNodesRecursive(term, nodes, n => n.label + ' ' + n.data.additionalSearchField))
    );

    this.selectedNodes$ = combineLatest([this.store$.select(fromAudienceSelectors.getTdaAudiences), nodes$, this.selectedReset$]).pipe(
      takeUntil(this.destroyed$),
      map(([selected]) => selected.map(s => ({ key: s.audienceIdentifier }))),
    );

    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() =>  this.searchTerm$.next(''));
  }

  public selectVariable(event: TreeNode) : void {
    this.audienceService.addAudience(event.data);
  }

  public removeVariable(event: TreeNode) : void {
    const isDependent = this.reservedAudienceIds.has(Number(event.key));
    if (isDependent) {
      const header = 'Invalid Delete';
      const message = 'Audiences used to create a Combined, Converted, or Composite Audience can not be deleted.';
      this.store$.dispatch(new ShowSimpleMessageBox({ message, header }));
      this.selectedReset$.next();
    } else {
      this.audienceService.removeAudience(event.data);
    }
  }

  public trackByKey(index: number, node: TreeNode) : string {
    return node.key;
  }
}
