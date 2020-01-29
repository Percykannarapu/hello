import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification } from '@val/messaging';
import { TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { AppStateService } from '../../../services/app-state.service';
import { TargetAudienceTdaService, TdaAudienceDescription } from '../../../services/target-audience-tda.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { LocalAppState } from '../../../state/app.interfaces';

@Component({
  selector: 'val-offline-audience-tda',
  templateUrl: './offline-audience-tda.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OfflineAudienceTdaComponent implements OnInit {
  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public selectedVariables: TreeNode[] = [];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private audienceService: TargetAudienceTdaService,
              private parentAudienceService: TargetAudienceService,
              private cd: ChangeDetectorRef,
              private stateService: AppStateService,
              private store$: Store<LocalAppState>) {
    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
  }

  private static asFolder(category: TdaAudienceDescription) : TreeNode {
    return {
      label: category.displayName,
      data: category,
      expandedIcon: 'fa fa-folder-open',
      collapsedIcon: 'fa fa-folder',
      leaf: false,
      selectable: false,
      children: category.children.map(child => this.asLeaf(child))
    };
  }

  private static asLeaf(variable: TdaAudienceDescription) : TreeNode {
    return {
      label: variable.displayName,
      data: variable,
      icon: 'fa fa-file-o',
      leaf: true,
    };
  }

  public ngOnInit() : void {
    const message = 'There was an error during retrieval of the Offline Audience descriptions. Please refresh your browser to try again.';
    this.audienceService.getAudienceDescriptions().subscribe(
      folder =>  {
        if (folder.children.length > 0)
          this.allNodes.push(OfflineAudienceTdaComponent.asFolder(folder));
      },
      (err) => {
        console.error(err);
        this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'TDA Connection Error' }));
      },
      () => {
        this.allNodes.sort((a, b) => a.data.sortOrder - b.data.sortOrder);
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
        this.cd.markForCheck();
      });
    this.searchTerm$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));

    this.parentAudienceService.allAudiencesBS$.pipe(
    map(audiences => audiences.filter(a => a.audienceSourceType === 'Offline')),
    ).subscribe(audiences => this.syncAudiencesCheckData(audiences));
  }

  private filterNodes(term: string) {
    if (term == null || term.length === 0) {
      this.currentNodes = Array.from(this.allNodes);
    } else {
      this.currentNodes = [];
      this.allNodes.forEach(category => {
        const newChildren = category.children.filter(variable => variable.label.toLowerCase().includes(term.toLowerCase()) ||
                                                               variable.data.additionalSearchField.toLowerCase().includes(term.toLowerCase()));
        if (newChildren.length > 0) {
          const newCategory = Object.assign({}, category);
          newCategory.children = newChildren;
          newCategory.expanded = newChildren.length < 6;
          this.currentNodes.push(newCategory);
        }
      });
    }
    this.cd.markForCheck();
  }

  public selectVariable(event: TreeNode) : void {
    this.audienceService.addAudience(event.data);
  }

  public removeVariable(event: TreeNode) : void {
    this.audienceService.removeAudience(event.data);
  }

  private syncCheckData(result: AudienceDataDefinition[]){
    this.selectedVariables = this.selectedVariables.filter(node => node.data.identifier !== result[0].audienceIdentifier);
    this.cd.markForCheck();
  }

  private syncAudiencesCheckData(audiences: AudienceDataDefinition[]){
    this.clearSelections();
    audiences.forEach(audience => {
      this.allNodes.forEach(category => {
        const children = category.children.filter(child => child.data.identifier === audience.audienceIdentifier);
        if (children.length > 0)
          this.selectedVariables.push(children[0]);
      });
    });
    this.cd.markForCheck();
  }

  private clearSelections(){
     this.selectedVariables = [];
     this.cd.markForCheck();
  }
}
