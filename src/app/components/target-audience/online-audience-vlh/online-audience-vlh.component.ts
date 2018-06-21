import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/primeng';
import { Subject } from 'rxjs/index';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { OnlineAudienceDescription, SourceTypes, TargetAudienceOnlineService } from '../../../services/target-audience-online.service';
import { TargetAudienceService } from '../../../services/target-audience.service';

@Component({
  selector: 'val-online-audience-vlh',
  templateUrl: './online-audience-vlh.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudienceVlhComponent implements OnInit, AfterViewInit {

  static sources: Set<string> = new Set<string>();

  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public currentSelectedNodes: TreeNode[];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private audienceService: TargetAudienceOnlineService, private parentAudienceService: TargetAudienceService, private cd: ChangeDetectorRef) {
    this.currentSelectedNodes = this.allNodes;

    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
  }

  private static asTreeNode(variable: OnlineAudienceDescription) : TreeNode {
    this.sources.add(variable.source);
    return {
      label: variable.categoryName,
      data: variable,
      icon: 'fa-fontAwesome fa-file-o',
      leaf: true,
    };
  }

  ngOnInit() {
    this.searchTerm$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));
  }

  ngAfterViewInit() : void {
    this.audienceService.getAudienceDescriptions([SourceTypes.VLH]).subscribe(
      folders => folders.forEach(f => this.allNodes.push(OnlineAudienceVlhComponent.asTreeNode(f))),
      err => console.error('There was an error during retrieval of the VLH descriptions', err),
      () => {
        this.allNodes.sort((a, b) => a.leaf === b.leaf ? a.label.localeCompare(b.label) : a.leaf ? 1 : -1);
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
        this.cd.markForCheck();
      });
  }

  public selectVariable(event: TreeNode) : void {
    this.currentSelectedNodes.push(event);
    this.audienceService.addAudience(event.data, SourceTypes.VLH);
  }

  public removeVariable(event: TreeNode) : void {
    const indexToRemove = this.currentSelectedNodes.indexOf(event);
    this.currentSelectedNodes.splice(indexToRemove, 1);
    this.audienceService.removeAudience(event.data, SourceTypes.VLH);
  }

  private filterNodes(term: string) {
    if (term == null || term.length === 0) {
      this.currentNodes = this.allNodes;
    } else {
      this.currentNodes = this.allNodes.filter(n => n.data.categoryName.toLowerCase().includes(term.toLowerCase()));
    }
    this.cd.markForCheck();
  }

  private syncCheckData(result: AudienceDataDefinition[]){
    this.currentSelectedNodes = this.currentSelectedNodes.filter(node => node.data.categoryId != result[0].audienceIdentifier);
    this.cd.markForCheck();
  }
}
