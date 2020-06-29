import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ErrorNotification } from '@val/messaging';
import { TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { AppStateService } from '../../../services/app-state.service';
import { TargetAudienceTdaService, TdaAudienceDescription } from '../../../services/target-audience-tda.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { LocalAppState } from '../../../state/app.interfaces';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

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
  private createdAudiences;
  private allAudiences;
  public showDialog: boolean = false;
  public dialogboxWarningmsg: string = '';
  public dialogboxHeader: string = '';

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
        this.store$.dispatch(new ErrorNotification({ message, notificationTitle: 'TDA Connection Error', additionalErrorInfo: err }));
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

    this.store$.select(fromAudienceSelectors.getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Online' || aud.audienceSourceType === 'Offline')),
      ).subscribe(audiences => {
        this.allAudiences =  Array.from(new Set(audiences));
      });

    this.store$.select(fromAudienceSelectors.getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined' || aud.audienceSourceType === 'Converted' || aud.audienceSourceType === 'Combined/Converted' || aud.audienceSourceType === 'Composite')),
    ).subscribe(audiences => {
      this.createdAudiences =  Array.from(new Set(audiences));
    });

    this.stateService.clearUI$.subscribe(() => {
      this.searchTerm$.next('');
      this.currentNodes.forEach(node => node.expanded = false);
    });
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
    const isExisting = this.allAudiences.filter(aud => aud.audienceIdentifier === event.data.identifier).length === 1;
    if (!isExisting){
      this.audienceService.addAudience(event.data);
    }
  }

  public removeVariable(event: TreeNode) : void {
   let isDependent: boolean = false;
   isDependent = this.createdAudiences.filter(combineAud => combineAud.combinedAudiences.includes(event.data.identifier)).length > 0;
   this.createdAudiences.forEach(aud => aud.compositeSource.forEach(a => {
    if (a.id.toString() === event.data.identifier)
      isDependent = true;
    }));
    if (isDependent){
      this.dialogboxHeader = 'Invalid Delete!';
      this.dialogboxWarningmsg = 'Audiences used to create a Combined or Converted or Composite Audience can not be deleted.';
      this.showDialog = true;
      this.selectVariable(event);
    } else {
    this.audienceService.removeAudience(event.data);
    }
  }

  public closeDialog(){
    this.showDialog = false;
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
