import { Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/primeng';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs';
import { TargetAudienceTdaService, TdaAudienceDescription } from '../../../services/target-audience-tda.service';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { TargetAudienceService } from '../../../services/target-audience.service';

@Component({
  selector: 'val-offline-audience-tda',
  templateUrl: './offline-audience-tda.component.html'
})
export class OfflineAudienceTdaComponent implements OnInit {
  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public selectedVariables: TreeNode[] = [];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private audienceService: TargetAudienceTdaService, private parentAudienceService: TargetAudienceService) {
    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
  }

  private static asFolder(category: TdaAudienceDescription) : TreeNode {
    return {
      label: category.displayName,
      data: category,
      expandedIcon: 'ui-icon-folder-open',
      collapsedIcon: 'ui-icon-folder',
      leaf: false,
      selectable: false,
      children: category.children.map(child => this.asLeaf(child))
    };
  }

  private static asLeaf(variable: TdaAudienceDescription) : TreeNode {
    return {
      label: variable.displayName,
      data: variable,
      icon: 'fa-fontAwesome fa-file-o',
      leaf: true,
    };
  }

  public ngOnInit() : void {
    this.audienceService.getAudienceDescriptions().subscribe(
      folder => this.allNodes.push(OfflineAudienceTdaComponent.asFolder(folder)),
      err => console.error('There was an error during retrieval of the TDA Audience descriptions', err),
      () => {
        this.allNodes.sort((a, b) => a.data.sortOrder - b.data.sortOrder);
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
      });
    this.searchTerm$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));
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
  }

  public selectVariable(event: TreeNode) : void {
    this.audienceService.addAudience(event.data);
  }

  public removeVariable(event: TreeNode) : void {
    this.audienceService.removeAudience(event.data);
  }

  private syncCheckData(result: AudienceDataDefinition[]){
    this.selectedVariables = this.selectedVariables.filter(node => node.data.identifier != result[0].audienceIdentifier);
  }
}
