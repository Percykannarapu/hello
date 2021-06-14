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
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { filterTreeNodesRecursive, treeNodeSortBuilder } from '../../../../common/treenode-utils';
import * as fromInMarket from '../../../../impower-datastore/state/transient/audience-definitions/in-market/in-market-audience.reducer';
import * as fromInterest from '../../../../impower-datastore/state/transient/audience-definitions/interest/interest-audience.reducer';
import { DeleteAudience } from '../../../../impower-datastore/state/transient/audience/audience.actions';
import { OnlineAudienceDescription } from '../../../../models/audience-categories.model';
import { AudienceDataDefinition } from '../../../../models/audience-data.model';
import { OnlineSourceNames, OnlineSourceTypes } from '../../../../models/audience-enums';
import { createOnlineAudienceInstance } from '../../../../models/audience-factories';
import { UnifiedAudienceDefinitionService } from '../../../../services/unified-audience-definition.service';
import { UnifiedAudienceService } from '../../../../services/unified-audience.service';
import { CreateAudienceUsageMetric } from '../../../../state/usage/targeting-usage.actions';
import { LoggingService } from '../../../../val-modules/common/services/logging.service';

@Component({
  selector: 'val-online-audience-apio',
  templateUrl: './online-audience-apio.component.html',
  styleUrls: ['./online-audience-apio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudienceApioComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number>;

  public currentNodes$: Observable<TreeNode<OnlineAudienceDescription>[]>;
  public currentSelectedNodes$: Observable<TreeNode<OnlineAudienceDescription>[]>;

  public loading$: Observable<boolean>;
  public searchTerm$: Subject<string> = new BehaviorSubject<string>(null);
  public includeFolder$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public selectedSource$ = new BehaviorSubject<OnlineSourceTypes>(OnlineSourceTypes.Interest);

  // these have to be exposed like this so they are available in the template
  public SourceType = OnlineSourceTypes;

  private destroyed$ = new Subject<void>();
  private selectedReset$ = new BehaviorSubject<void>(null);

  constructor(private appStateService: AppStateService,
              private logger: LoggingService,
              private store$: Store<LocalAppState>,
              private definitionService: UnifiedAudienceDefinitionService,
              private audienceService: UnifiedAudienceService) {}

  private static asTreeNode(variable: OnlineAudienceDescription, sourceType: OnlineSourceTypes) : TreeNode<OnlineAudienceDescription> {
    const sourceName = OnlineSourceNames[sourceType];
    if (variable.isLeaf) return this.asLeaf(variable, sourceName);
    return this.asFolder(variable, sourceType, sourceName);
  }

  private static asFolder(variable: OnlineAudienceDescription, sourceType: OnlineSourceTypes, sourceName: string) : TreeNode<OnlineAudienceDescription> {
    const children = variable.children.map(child => this.asTreeNode(child, sourceType));
    children.sort(treeNodeSortBuilder(n => n.label, CommonSort.GenericString));
    return {
      label: variable.taxonomyParsedName,
      data: variable,
      expandedIcon: 'pi pi-folder-open',
      collapsedIcon: 'pi pi-folder',
      leaf: false,
      selectable: false,
      children: children,
      key: `${variable.digLookup.get(sourceName)}`
    };
  }

  private static asLeaf(variable: OnlineAudienceDescription, sourceName: string) : TreeNode<OnlineAudienceDescription> {
    return {
      label: variable.categoryName,
      data: variable,
      icon: 'pi pi-file-o',
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

  public trackByKey(index: number, node: TreeNode<OnlineAudienceDescription>) : string {
    return node.key;
  }

  public selectVariable(event: TreeNode<OnlineAudienceDescription>) : void {
    const model = this.createModelInstance(event.data);
    this.usageMetricCheckUncheckApio(true, event.data);
    this.audienceService.addAudience(model);
  }

  public removeVariable(event: TreeNode<OnlineAudienceDescription>) : void {
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
      const model = this.createModelInstance(event.data);
      this.usageMetricCheckUncheckApio(false, event.data);
      this.store$.dispatch(new DeleteAudience ({ id: model.audienceIdentifier }));
    }
  }

  public onSourceChanged(source: OnlineSourceTypes) {
    this.selectedSource$.next(source);
  }

  private usageMetricCheckUncheckApio(isChecked: boolean, audience: OnlineAudienceDescription) {
    const source = this.selectedSource$.getValue();
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const metricText = audience.digLookup.get(OnlineSourceNames[source]) + '~' + audience.taxonomyParsedName.replace('~', ':') + '~' + source + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('online', isChecked ? 'checked' : 'unchecked', metricText));
  }

  private createModelInstance(data: OnlineAudienceDescription) : AudienceDataDefinition {
    const digId = data.digLookup.get(OnlineSourceNames[this.selectedSource$.getValue()]);
    return createOnlineAudienceInstance(data.categoryName, `${digId}`, FieldContentTypeCodes.Index, this.selectedSource$.getValue());
  }
}
