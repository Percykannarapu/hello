import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Subject } from 'rxjs';
import { TreeNode } from 'primeng/primeng';
import { debounceTime, distinctUntilChanged } from 'rxjs/operators';
import { OnlineAudienceDescription, SourceTypes, TargetAudienceOnlineService } from '../../../services/target-audience-online.service';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { AppStateService } from '../../../services/app-state.service';

interface ApioTreeNode extends TreeNode {
  originalChildren?: ApioTreeNode[];
}

@Component({
  selector: 'val-online-audience-apio',
  templateUrl: './online-audience-apio.component.html',
  styleUrls: ['./online-audience-apio.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudienceApioComponent implements OnInit {

  static sources: Set<string> = new Set<string>();

  private selectedNodeMap: Map<SourceTypes, ApioTreeNode[]> = new Map<SourceTypes, ApioTreeNode[]>();
  private allNodes: ApioTreeNode[] = [];

  @Input() useNarrowLayout: boolean;

  public currentNodes: ApioTreeNode[] = [];
  public currentSelectedNodes: ApioTreeNode[];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();
  public includeFolder$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public selectedSource: SourceTypes = SourceTypes.Interest;

  // these have to be exposed like this so they are available in the template
  public SourceType = SourceTypes;

  constructor(private audienceService: TargetAudienceOnlineService, 
    private parentAudienceService: TargetAudienceService, 
    private cd: ChangeDetectorRef,
    private stateSetvice: AppStateService) {
    this.selectedNodeMap.set(SourceTypes.InMarket, []);
    this.selectedNodeMap.set(SourceTypes.Interest, []);
    this.currentSelectedNodes = this.selectedNodeMap.get(this.selectedSource);

    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
  }

  private static asTreeNode(variable: OnlineAudienceDescription) : ApioTreeNode {
    if (variable.isLeaf) return this.asLeaf(variable);
    return this.asFolder(variable);
  }

  private static asFolder(variable: OnlineAudienceDescription) : ApioTreeNode {
    const children = variable.children.map(child => this.asTreeNode(child));
    children.sort((a, b) => a.leaf === b.leaf ? a.label.localeCompare(b.label) : a.leaf ? 1 : -1);
    return {
      label: variable.taxonomyParsedName,
      data: variable,
      expandedIcon: 'ui-icon-folder-open',
      collapsedIcon: 'ui-icon-folder',
      leaf: false,
      selectable: false,
      originalChildren: children,
      children: Array.from(children)
    };
  }

  private static asLeaf(variable: OnlineAudienceDescription) : ApioTreeNode {
    this.sources.add(Array.from(variable.digLookup.keys()).join('/'));
    return {
      label: variable.categoryName,
      data: variable,
      icon: 'fa fa-fontAwesome fa-file-o',
      leaf: true,
    };
  }

  ngOnInit() {
    this.audienceService.getAudienceDescriptions([SourceTypes.InMarket, SourceTypes.Interest]).subscribe(
      folders => folders.forEach(f => this.allNodes.push(OnlineAudienceApioComponent.asTreeNode(f))),
      err => console.error('There was an error during retrieval of the Apio Audience descriptions', err),
      () => {
        this.allNodes.sort((a, b) => a.leaf === b.leaf ? a.label.localeCompare(b.label) : a.leaf ? 1 : -1);
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
        this.cd.markForCheck();
      }
    );
    const search$ = this.searchTerm$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    );
    combineLatest(search$, this.includeFolder$).subscribe(([term, includeFolders]) => this.filterNodes(term, includeFolders));
    this.stateSetvice.getClearUserInterfaceObs().subscribe(bool => {
        if (bool){
          this.clearSelections();
        }
    });
  }

  public selectVariable(event: ApioTreeNode) : void {
    this.currentSelectedNodes.push(event);
    this.audienceService.addAudience(event.data, this.selectedSource);
  }

  public removeVariable(event: ApioTreeNode) : void {
    const indexToRemove = this.currentSelectedNodes.indexOf(event);
    this.currentSelectedNodes.splice(indexToRemove, 1);
    this.audienceService.removeAudience(event.data, this.selectedSource);
  }

  public onSourceChanged(source: SourceTypes) {
    this.currentSelectedNodes = this.selectedNodeMap.get(source);
    this.cd.markForCheck();
  }

  private filterNodes(term: string, includeFolders: boolean) {
    if (term == null || term.length === 0) {
      // the filter function is destructive, so I have to back it out this way
      this.unFilterRecursive(this.allNodes);
      this.currentNodes = Array.from(this.allNodes);
    } else {
      this.currentNodes = this.filterRecursive(Array.from(this.allNodes), term.toLowerCase(), includeFolders);
    }
    this.cd.markForCheck();
  }

  private filterRecursive(nodes: ApioTreeNode[], term: string, includeFolders: boolean) : ApioTreeNode[] {
    return nodes.filter(n => {
      if (!n.leaf) {
        n.children = this.filterRecursive(n.originalChildren, term, includeFolders);
        n.expanded = n.children.length < 6;
        return n.children.length > 0;
      } else {
        const searchField = includeFolders ? n.data.taxonomy : n.label;
        return searchField.toLowerCase().includes(term);
      }
    });
  }

  private unFilterRecursive(nodes: ApioTreeNode[]) {
    nodes.forEach(n => {
      if (!n.leaf && n.originalChildren != null) {
        n.children = Array.from(n.originalChildren);
        n.expanded = false;
        this.unFilterRecursive(n.originalChildren);
      }
    });
  }

  private syncCheckData(result: AudienceDataDefinition[]) {
    const indexToRemove = this.currentSelectedNodes.findIndex(node => node.data.digCategoryId != result[0].audienceIdentifier);
    this.currentSelectedNodes.splice(indexToRemove, 1);
    this.cd.markForCheck();
  }

  private clearSelections(){
    this.currentSelectedNodes = [];
    this.cd.markForCheck();
  }
}
