import { Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/primeng';
import { CategoryVariable, DemographicCategory, TopVarService } from '../../../services/top-var.service';
import { map, debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { Subject } from 'rxjs/Subject';

@Component({
  selector: 'val-offline-audience-tda',
  templateUrl: './offline-audience-tda.html'
})
export class OfflineAudienceTdaComponent implements OnInit {
  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public selectedVariables: TreeNode[];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private varService: TopVarService) { }

  private static asFolder(category: DemographicCategory) : TreeNode {
    return {
      label: category.tabledesc,
      data: category,
      expandedIcon: 'ui-icon-folder-open',
      collapsedIcon: 'ui-icon-folder',
      leaf: false
    };
  }

  private static asLeaf(variable: CategoryVariable) : TreeNode {
    return {
      label: variable.fielddescr,
      data: variable,
      icon: 'fa-fontAwesome fa-file-o',
      leaf: true,
    };
  }

  public ngOnInit() : void {
    const sub = this.varService.getDemographicCategories().subscribe(categories => {
      categories.sort((a, b) => a.sort - b.sort);
      this.allNodes = categories.map(c => OfflineAudienceTdaComponent.asFolder(c));
      this.allNodes.forEach(n => this.fillNode(n));
    }, null, () => {
      sub.unsubscribe();
      this.loading = false;
      this.currentNodes = Array.from(this.allNodes);
    });
    this.searchTerm$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));
  }

  private fillNode(currentNode: TreeNode) : void {
    if (currentNode.children == null || currentNode.children.length === 0) {
      const currentSub = this.varService.getVariablesByCategory(currentNode.data.tablename).pipe(
        map(variables => variables.map(v => OfflineAudienceTdaComponent.asLeaf(v)))
      ).subscribe(nodes => currentNode.children = Array.from(nodes), null, () => currentSub.unsubscribe());
    }
  }

  private filterNodes(term: string) {
    if (term == null || term.length === 0) {
      this.currentNodes = Array.from(this.allNodes);
    } else {
      this.currentNodes = [];
      this.allNodes.forEach(category => {
        const newChildren = category.children.filter(variable => variable.label.toLowerCase().includes(term.toLowerCase()) ||
                                                               variable.data.fieldname.toLowerCase().includes(term.toLowerCase()));
        if (newChildren.length > 0) {
          const newCategory = Object.assign({}, category);
          newCategory.children = newChildren;
          newCategory.expanded = newChildren.length < 6;
          this.currentNodes.push(newCategory);
        }
      });
    }
  }
}
