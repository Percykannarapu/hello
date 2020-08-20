import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort } from '@val/common';
import { ShowSimpleMessageBox } from '@val/messaging';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { AppStateService } from 'app/services/app-state.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { TreeNode } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, map, share, takeUntil } from 'rxjs/operators';
import { filterTreeNodesRecursive, treeNodeSortBuilder } from '../../../../common/treenode-utils';
import * as fromInMarket from '../../../../impower-datastore/state/transient/audience-definitions/in-market/in-market-audience.reducer';
import * as fromInterest from '../../../../impower-datastore/state/transient/audience-definitions/interest/interest-audience.reducer';
import { OnlineAudienceDescription } from '../../../../models/audience-categories.model';
import { OnlineSourceTypes } from '../../../../models/audience-enums';
import { TargetAudienceOnlineService } from '../../../../services/target-audience-online.service';
import { UnifiedAudienceDefinitionService } from '../../../../services/unified-audience-definition.service';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';

const sourceNameMap = {
  [OnlineSourceTypes.Interest]: 'interest',
  [OnlineSourceTypes.InMarket]: 'in_market'
};

@Component({
  selector: 'val-online-audience-apio',
  templateUrl: './online-audience-apio.component.html',
  styleUrls: ['./online-audience-apio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudienceApioComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number>;

  public currentNodes$: Observable<TreeNode[]>;
  public currentSelectedNodes$: Observable<TreeNode[]>;

  public loading$: Observable<boolean>;
  public searchTerm$: Subject<string> = new BehaviorSubject<string>(null);
  public includeFolder$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public selectedSource$ = new BehaviorSubject<OnlineSourceTypes>(OnlineSourceTypes.Interest);

  // these have to be exposed like this so they are available in the template
  public SourceType = OnlineSourceTypes;

  private destroyed$ = new Subject<void>();
  private selectedReset$ = new BehaviorSubject<void>(null);

  constructor(private audienceService: TargetAudienceOnlineService,
              private appStateService: AppStateService,
              private definitionService: UnifiedAudienceDefinitionService,
              private logger: LoggingService,
              private store$: Store<LocalAppState>) {}

  private static asTreeNode(variable: OnlineAudienceDescription, sourceType: OnlineSourceTypes) : TreeNode {
    const sourceName = sourceNameMap[sourceType];
    if (variable.isLeaf) return this.asLeaf(variable, sourceName);
    return this.asFolder(variable, sourceType, sourceName);
  }

  private static asFolder(variable: OnlineAudienceDescription, sourceType: OnlineSourceTypes, sourceName: string) : TreeNode {
    const children = variable.children.map(child => this.asTreeNode(child, sourceType));
    children.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
    return {
      label: variable.taxonomyParsedName,
      data: variable,
      expandedIcon: 'fa fa-folder-open',
      collapsedIcon: 'fa fa-folder',
      leaf: false,
      selectable: false,
      children: children,
      key: `${variable.digLookup.get(sourceName)}`
    };
  }

  private static asLeaf(variable: OnlineAudienceDescription, sourceName: string) : TreeNode {
    return {
      label: variable.categoryName,
      data: variable,
      icon: 'fa fa-file-o',
      leaf: true,
      key: `${variable.digLookup.get(sourceName)}`
    };
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.loading$ = combineLatest([this.store$.select(fromInMarket.fetchComplete), this.store$.select(fromInterest.fetchComplete)]).pipe(
      takeUntil(this.destroyed$),
      map(([fetchA, fetchB]) => !(fetchA && fetchB))
    );

    const interest$ = this.definitionService.getInterestDefinitions().pipe(
      map(definitions => {
        const nodes = definitions.map(d => OnlineAudienceApioComponent.asTreeNode(d, OnlineSourceTypes.Interest));
        nodes.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
        return nodes;
      }),
      share()
    );
    const inMarket$ = this.definitionService.getInMarketDefinitions().pipe(
      map(definitions => {
        const nodes = definitions.map(d => OnlineAudienceApioComponent.asTreeNode(d, OnlineSourceTypes.InMarket));
        nodes.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
        return nodes;
      }),
      share()
    );

    const selectedInterest$ = combineLatest([this.store$.select(fromAudienceSelectors.getInterestAudiences), interest$, this.selectedReset$]).pipe(
      map(([selected]) => selected.map(s => ({ key: s.audienceIdentifier }))),
      share()
    );

    const selectedInMarket$ = combineLatest([this.store$.select(fromAudienceSelectors.getInMarketAudiences), inMarket$, this.selectedReset$]).pipe(
      map(([selected]) => selected.map(s => ({ key: s.audienceIdentifier }))),
      share()
    );

    const search$ = this.searchTerm$.pipe(debounceTime(250));
    this.currentNodes$ = combineLatest([search$, this.includeFolder$, interest$, inMarket$, this.selectedSource$]).pipe(
      takeUntil(this.destroyed$),
      map(([search, includeFolders, interest, inMarket, source]) => (source === OnlineSourceTypes.Interest ? [search, includeFolders, interest] as const : [search, includeFolders, inMarket] as const)),
      map(([search, includeFolders, nodes]) => filterTreeNodesRecursive(search, nodes, n => (includeFolders ? n.data.taxonomy : n.label)))
    );

    this.currentSelectedNodes$ = combineLatest([selectedInterest$, selectedInMarket$, this.selectedSource$]).pipe(
      takeUntil(this.destroyed$),
      map(([interest, inMarket, source]) => (source === OnlineSourceTypes.Interest ? interest : inMarket))
    );

    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$)
    ).subscribe(() => {
      this.selectedSource$.next(OnlineSourceTypes.Interest);
      this.includeFolder$.next(false);
      this.searchTerm$.next(null);
    });

  }

  public trackByKey(index: number, node: TreeNode) : string {
    return node.key;
  }

  public selectVariable(event: TreeNode) : void {
    this.audienceService.addAudience(event.data, this.selectedSource$.getValue());
  }

  public removeVariable(event: TreeNode) : void {
    let isDependent: boolean;
    switch (this.selectedSource$.getValue()) {
      case OnlineSourceTypes.InMarket:
        isDependent = this.reservedAudienceIds.has(event.data.digLookup.get('in_market'));
        break;
      case OnlineSourceTypes.Interest:
        isDependent = this.reservedAudienceIds.has(event.data.digLookup.get('interest'));
        break;
    }
    if (isDependent) {
      const header = 'Invalid Delete';
      const message = 'Audiences used to create a Combined, Converted, or Composite Audience can not be deleted.';
      this.store$.dispatch(new ShowSimpleMessageBox({ message, header }));
      this.selectedReset$.next();
    } else {
      this.audienceService.removeAudience(event.data, this.selectedSource$.getValue());
    }
  }

  public onSourceChanged(source: OnlineSourceTypes) {
    this.selectedSource$.next(source);
  }
}