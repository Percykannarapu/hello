import { Component, OnInit } from '@angular/core';
import { OnlineAudienceDescription, SourceTypes, TargetAudienceOnlineService } from '../../../services/target-audience-online.service';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { TreeNode } from 'primeng/primeng';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { Subject } from 'rxjs/index';
import { AudienceDataDefinition } from '../../../models/audience-data.model';

@Component({
  selector: 'val-online-audience-pixel',
  templateUrl: './online-audience-pixel.component.html'
})
export class OnlineAudiencePixelComponent implements OnInit {

  static sources: Set<string> = new Set<string>();

  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public currentSelectedNodes: TreeNode[];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private audienceService: TargetAudienceOnlineService, private parentAudienceService: TargetAudienceService) {
    this.currentSelectedNodes = this.allNodes;

    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
  }

  private static asTreeNode(variable: OnlineAudienceDescription) : TreeNode {
    this.sources.add(variable.source);
    return {
      label: undefined, // template in the html markup does this since we have spacing requirements
      data: variable,
      icon: 'fa-fontAwesome fa-file-o',
      selectable: Number(variable.taxonomy) > 1000,
      leaf: true,
    };
  }

  ngOnInit() {
    this.searchTerm$.pipe(
      debounceTime(400),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));
  }

  public selectVariable(event: TreeNode) : void {
    this.currentSelectedNodes.push(event);
    this.audienceService.addAudience(event.data, SourceTypes.Pixel);
  }

  public removeVariable(event: TreeNode) : void {
    const indexToRemove = this.currentSelectedNodes.indexOf(event);
    this.currentSelectedNodes.splice(indexToRemove, 1);
    this.audienceService.removeAudience(event.data, SourceTypes.Pixel);
  }

  public onSelected(event: boolean) : void {
    if (event && this.loading) {
      this.audienceService.getAudienceDescriptions([SourceTypes.Pixel]).subscribe(
        folders => folders.forEach(f => this.allNodes.push(OnlineAudiencePixelComponent.asTreeNode(f))),
        err => console.error('There was an error during retrieval of the Pixel descriptions', err),
        () => {
          this.allNodes.sort((a, b) => a.data.categoryName.localeCompare(b.data.categoryName));
          this.currentNodes = Array.from(this.allNodes);
          this.loading = false;
        }
      );
    }
  }

  private filterNodes(term: string) {
    if (term == null || term.length === 0) {
      this.currentNodes = this.allNodes;
    } else {
      this.currentNodes = this.allNodes.filter(n => n.data.categoryName.toLowerCase().includes(term.toLowerCase()));
    }
  }

  private syncCheckData(result: AudienceDataDefinition[]){
    this.currentSelectedNodes = this.currentSelectedNodes.filter(node => node.data.categoryId != result[0].audienceIdentifier);
  }

}
