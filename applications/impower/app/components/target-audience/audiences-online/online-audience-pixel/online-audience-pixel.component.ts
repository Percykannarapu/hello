import { ChangeDetectionStrategy, Component, Input, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { CommonSort, isConvertibleToNumber } from '@val/common';
import { ShowSimpleMessageBox } from '@val/messaging';
import { AppStateService } from 'app/services/app-state.service';
import { TreeNode } from 'primeng/api';
import { BehaviorSubject, combineLatest, Observable, Subject } from 'rxjs';
import { debounceTime, map, share, takeUntil } from 'rxjs/operators';
import { filterTreeNodesRecursive, treeNodeSortBuilder } from '../../../../common/treenode-utils';
import * as fromVlh from '../../../../impower-datastore/state/transient/audience-definitions/vlh/vlh-audience.reducer';
import * as fromAudienceSelectors from '../../../../impower-datastore/state/transient/audience/audience.selectors';
import { OnlineAudienceDescription } from '../../../../models/audience-categories.model';
import { OnlineSourceTypes } from '../../../../models/audience-enums';
import { TargetAudienceOnlineService } from '../../../../services/target-audience-online.service';
import { TargetAudienceService } from '../../../../services/target-audience.service';
import { UnifiedAudienceDefinitionService } from '../../../../services/unified-audience-definition.service';
import { LocalAppState } from '../../../../state/app.interfaces';

const UnSelectableLimit = 1000;

@Component({
  selector: 'val-online-audience-pixel',
  templateUrl: './online-audience-pixel.component.html',
  styleUrls: ['./online-audience-pixel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudiencePixelComponent implements OnInit, OnDestroy {

  @Input() reservedAudienceIds: Set<number> = new Set<number>();

  public currentNodes$: Observable<TreeNode[]>;
  public selectedNodes$: Observable<TreeNode[]>;
  public loading$: Observable<boolean>;
  public searchTerm$ = new BehaviorSubject<string>(null);

  private destroyed$ = new Subject<void>();
  private selectedReset$ = new BehaviorSubject<void>(null);

  constructor(private audienceService: TargetAudienceOnlineService,
              private parentAudienceService: TargetAudienceService,
              private definitionService: UnifiedAudienceDefinitionService,
              private appStateService: AppStateService,
              private store$: Store<LocalAppState>) {}

  private static asTreeNode(variable: OnlineAudienceDescription) : TreeNode {
    const selectable: boolean = (isConvertibleToNumber(variable.taxonomy) && Number(variable.taxonomy) > UnSelectableLimit);
    return {
      label: variable.categoryName,
      data: variable,
      icon: `fa ${selectable ? 'fa fa-file-o' : 'fa fa-lock'}`,
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

  public selectVariable(event: TreeNode) : void {
    this.audienceService.addAudience(event.data, OnlineSourceTypes.Pixel);
  }

  public removeVariable(event: TreeNode) : void {
    const isDependent = this.reservedAudienceIds.has(Number(event.key));
    if (isDependent) {
      const header = 'Invalid Delete';
      const message = 'Audiences used to create a Combined, Converted, or Composite Audience can not be deleted.';
      this.store$.dispatch(new ShowSimpleMessageBox({ message, header }));
      this.selectedReset$.next();
    } else {
      this.audienceService.removeAudience(event.data, OnlineSourceTypes.Pixel);
    }
  }

  public formatCount(number: string) {
    return isConvertibleToNumber(number) ?  Number(number).toLocaleString() : 'n/a';
  }

  public trackByKey(index: number, node: TreeNode) : string {
    return node.key;
  }
}
