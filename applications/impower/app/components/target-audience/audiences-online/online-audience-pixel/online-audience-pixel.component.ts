import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort, isConvertibleToNumber } from '@val/common';
import { ShowSimpleMessageBox } from '@val/messaging';
import { AppStateService } from 'app/services/app-state.service';
import { TreeNode } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, map, share, takeUntil } from 'rxjs/operators';
import { FieldContentTypeCodes } from '../../../../../worker-shared/data-model/impower.data-model.enums';
import { filterTreeNodesRecursive, treeNodeSortBuilder } from '../../../../common/treenode-utils';
import * as fromVlh from '../../../../impower-datastore/state/transient/audience-definitions/vlh/vlh-audience.reducer';
import { DeleteAudience } from '../../../../impower-datastore/state/transient/audience/audience.actions';
import * as fromAudienceSelectors from '../../../../impower-datastore/state/transient/audience/audience.selectors';
import { OnlineAudienceDescription } from '../../../../models/audience-categories.model';
import { OnlineSourceNames, OnlineSourceTypes } from '../../../../models/audience-enums';
import { createOnlineAudienceInstance } from '../../../../models/audience-factories';
import { UnifiedAudienceDefinitionService } from '../../../../services/unified-audience-definition.service';
import { UnifiedAudienceService } from '../../../../services/unified-audience.service';
import { LocalAppState } from '../../../../state/app.interfaces';
import { CreateAudienceUsageMetric } from '../../../../state/usage/targeting-usage.actions';

const UnSelectableLimit = 1000;

@Component({
  selector: 'val-online-audience-pixel',
  templateUrl: './online-audience-pixel.component.html',
  styleUrls: ['./online-audience-pixel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudiencePixelComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();

  public currentNodes$: Observable<TreeNode<OnlineAudienceDescription>[]>;
  public selectedNodes$: Observable<TreeNode<OnlineAudienceDescription>[]>;
  public loading$: Observable<boolean>;
  public searchTerm$ = new BehaviorSubject<string>(null);

  private destroyed$ = new Subject<void>();
  private selectedReset$ = new BehaviorSubject<void>(null);

  constructor(private appStateService: AppStateService,
              private store$: Store<LocalAppState>,
              private definitionService: UnifiedAudienceDefinitionService,
              private audienceService: UnifiedAudienceService) {}

  private static asTreeNode(variable: OnlineAudienceDescription) : TreeNode<OnlineAudienceDescription> {
    const selectable: boolean = (isConvertibleToNumber(variable.taxonomy) && Number(variable.taxonomy) > UnSelectableLimit);
    return {
      label: variable.categoryName,
      data: variable,
      icon: `pi ${selectable ? 'pi-file-o' : 'pi-lock'}`,
      type: selectable ? undefined : 'disabled',
      selectable: selectable,
      leaf: true,
      key: `${variable.digLookup.get('pixel')}`
    };
  }

  ngOnDestroy() {
    this.destroyed$.next();
  }

  ngOnInit() {
    this.loading$ = this.store$.select(fromVlh.fetchComplete).pipe(
      takeUntil(this.destroyed$),
      map(result => !result)
    );

    const nodes$ = this.definitionService.getPixelDefinitions().pipe(
      map(definitions => {
        const nodes = definitions.map(d => OnlineAudiencePixelComponent.asTreeNode(d));
        nodes.sort(treeNodeSortBuilder(n => n.data.categoryName, CommonSort.GenericString));
        return nodes;
      }),
      share()
    );

    const textFilter$ = this.searchTerm$.pipe(debounceTime(250));
    this.currentNodes$ = combineLatest([textFilter$, nodes$]).pipe(
      takeUntil(this.destroyed$),
      map(([term, nodes]) => filterTreeNodesRecursive(term, nodes, n => n.data.categoryName))
    );

    this.selectedNodes$ = combineLatest([this.store$.select(fromAudienceSelectors.getPixelAudiences), nodes$, this.selectedReset$]).pipe(
      takeUntil(this.destroyed$),
      map(([selected]) => selected.map(s => ({ key: s.audienceIdentifier })))
    );

    this.appStateService.clearUI$.pipe(
      takeUntil(this.destroyed$),
    ).subscribe(() =>  this.searchTerm$.next(''));
  }

  public selectVariable(event: TreeNode<OnlineAudienceDescription>) : void {
    const model = createOnlineAudienceInstance(event.data.categoryName, `${event.data.digLookup.get(OnlineSourceNames[OnlineSourceTypes.Pixel])}`, FieldContentTypeCodes.Index, OnlineSourceTypes.Pixel);
    this.usageMetricCheckUncheckApio(true, event.data);
    this.audienceService.addAudience(model);
  }

  public removeVariable(event: TreeNode<OnlineAudienceDescription>) : void {
    const isDependent = this.reservedAudienceIds.has(Number(event.key));
    if (isDependent) {
      const header = 'Invalid Delete';
      const message = 'Audiences used to create a Combined, Converted, or Composite Audience can not be deleted.';
      this.store$.dispatch(new ShowSimpleMessageBox({ message, header }));
      this.selectedReset$.next();
    } else {
      const model = createOnlineAudienceInstance(event.data.categoryName, `${event.data.digLookup.get(OnlineSourceNames[OnlineSourceTypes.Pixel])}`, FieldContentTypeCodes.Index, OnlineSourceTypes.Pixel);
      this.usageMetricCheckUncheckApio(false, event.data);
      this.store$.dispatch(new DeleteAudience ({ id: model.audienceIdentifier }));
    }
  }

  public formatCount(number: string) {
    return isConvertibleToNumber(number) ?  Number(number).toLocaleString() : 'n/a';
  }

  public trackByKey(index: number, node: TreeNode<OnlineAudienceDescription>) : string {
    return node.key;
  }

  private usageMetricCheckUncheckApio(isChecked: boolean, audience: OnlineAudienceDescription) {
    const currentAnalysisLevel = this.appStateService.analysisLevel$.getValue();
    const metricText = audience.digLookup.get(OnlineSourceNames[OnlineSourceTypes.Pixel]) + '~' + audience.categoryName + '~' + OnlineSourceTypes.Pixel + '~' + currentAnalysisLevel;
    this.store$.dispatch(new CreateAudienceUsageMetric('online', isChecked ? 'checked' : 'unchecked', metricText));
  }
}
