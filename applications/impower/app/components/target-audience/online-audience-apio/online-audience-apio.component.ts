import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, ViewEncapsulation } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { BehaviorSubject, combineLatest, Subject, of } from 'rxjs';
import { debounceTime, distinctUntilChanged, map, filter } from 'rxjs/operators';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { OnlineAudienceDescription, OnlineSourceTypes, TargetAudienceOnlineService } from '../../../services/target-audience-online.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { AppStateService } from 'app/services/app-state.service';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';
import * as fromAudienceSelectors from 'app/impower-datastore/state/transient/audience/audience.selectors';

interface ApioTreeNode extends TreeNode {
  originalChildren?: ApioTreeNode[];
}

@Component({
  selector: 'val-online-audience-apio',
  templateUrl: './online-audience-apio.component.html',
  styleUrls: ['./online-audience-apio.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  encapsulation: ViewEncapsulation.None
})
export class OnlineAudienceApioComponent implements OnInit {

  static sources: Set<string> = new Set<string>();

  private selectedNodeMapInterest: Map<OnlineSourceTypes, ApioTreeNode[]> = new Map<OnlineSourceTypes, ApioTreeNode[]>();
  private selectedNodeMapInMarket: Map<OnlineSourceTypes, ApioTreeNode[]> = new Map<OnlineSourceTypes, ApioTreeNode[]>();
  private allNodes: ApioTreeNode[] = [];

  public currentNodes: ApioTreeNode[] = [];
  public currentSelectedNodesInterest: ApioTreeNode[];
  public currentSelectedNodesInMarket: ApioTreeNode[];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();
  public includeFolder$: BehaviorSubject<boolean> = new BehaviorSubject<boolean>(false);
  public selectedSource: OnlineSourceTypes = OnlineSourceTypes.Interest;

  // these have to be exposed like this so they are available in the template
  public SourceType = OnlineSourceTypes;
  private createdAudiences;
  public showDialog: boolean = false;
  public dialogboxWarningmsg: string = '';
  public dialogboxHeader: string = '';

  constructor(private audienceService: TargetAudienceOnlineService,
    private parentAudienceService: TargetAudienceService,
    private cd: ChangeDetectorRef,
    private appStateService: AppStateService,
    private logger: LoggingService,
    private store$: Store<LocalAppState>) {
    this.selectedNodeMapInMarket.set(OnlineSourceTypes.InMarket, []);
    this.selectedNodeMapInterest.set(OnlineSourceTypes.Interest, []);
    this.currentSelectedNodesInterest = this.selectedNodeMapInterest.get(this.selectedSource);
    this.currentSelectedNodesInMarket = this.selectedNodeMapInMarket.get(OnlineSourceTypes.InMarket);

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
      expandedIcon: 'fa fa-folder-open',
      collapsedIcon: 'fa fa-folder',
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
      icon: 'fa fa-file-o',
      leaf: true,
    };
  }

  selectNodes(audiences: AudienceDataDefinition[], ready: boolean) {
    if (!ready || audiences == null || audiences.length === 0) {
      this.clearSelections();
      return;
    }
    for (const audience of audiences) {
      const node = this.filterSingleNode(this.allNodes, audience.audienceName);
      if (node == null) {
        this.logger.warn.log('Unable to check audience after loading', audience);
        return;
      }
      if (audience.audienceSourceName == 'Interest') {
        if (this.currentSelectedNodesInterest.length === 0) {
          this.currentSelectedNodesInterest.push(node);
        } else if (this.currentSelectedNodesInterest.filter(n => n.label === node.label).length > 0) {
          continue; //the current selected list already has the node we are trying to push in
        } else {
          this.currentSelectedNodesInterest.push(node);
        }
      } else if (audience.audienceSourceName == 'In-Market') {
        if (this.currentSelectedNodesInMarket.length === 0) {
          this.currentSelectedNodesInMarket.push(node);
        } else if (this.currentSelectedNodesInMarket.filter(n => n.label === node.label).length > 0) {
          continue; //the current selected list already has the node we are trying to push in
        } else {
          this.currentSelectedNodesInMarket.push(node);
        }
      }
    }
    this.cd.markForCheck();
  }

  private filterSingleNode(nodes: ApioTreeNode[], term: string) : ApioTreeNode {
    let foundNode: ApioTreeNode = null;
    for (const node of nodes) {
      if (!node.leaf) {
        const n = this.filterSingleNode(node.originalChildren, term);
        if (n != null) {
          foundNode = n;
          break;
        }
      } else {
        if (term === node.label) {
          foundNode = node;
          break;
        }
      }
    }
    return foundNode;
  }

  ngOnInit() {
    this.audienceService.getAudienceDescriptions([OnlineSourceTypes.InMarket, OnlineSourceTypes.Interest]).subscribe(
//      folders => folders.forEach(f => this.allNodes.push(OnlineAudienceApioComponent.asTreeNode(f))),
      folders => folders.forEach(f => {
        this.allNodes.push(OnlineAudienceApioComponent.asTreeNode(f));
      }),
      err => this.logger.error.log('There was an error during retrieval of the Apio Audience descriptions', err),
      () => {
        this.allNodes.sort((a, b) => a.leaf === b.leaf ? a.label.localeCompare(b.label) : a.leaf ? 1 : -1);
        this.enableSource(this.selectedSource, this.allNodes);
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
        this.cd.markForCheck();
      }
    );
    const search$ = this.searchTerm$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    );
    combineLatest([search$, this.includeFolder$]).subscribe(([term, includeFolders]) => this.filterNodes(term, includeFolders));

    this.parentAudienceService.allAudiencesBS$.pipe(
      map(audiences => audiences.filter(a => a.audienceSourceType === 'Online' && (a.audienceSourceName === OnlineSourceTypes.Interest || a.audienceSourceName === OnlineSourceTypes.InMarket)))
    ).subscribe(audiences => this.selectNodes(audiences, true));


    this.store$.select(fromAudienceSelectors.getAllAudiences).pipe(
      filter(allAudiences => allAudiences != null),
      map(audiences => audiences.filter(aud => aud.audienceSourceType === 'Combined' || aud.audienceSourceType === 'Converted' || aud.audienceSourceType === 'Combined/Converted' || aud.audienceSourceType === 'Composite')),
    ).subscribe(audiences => {
      this.createdAudiences = Array.from(new Set(audiences));
    });

    this.appStateService.clearUI$.subscribe(() => {
      this.selectedSource = OnlineSourceTypes.Interest;
      this.includeFolder$.next(false); //new BehaviorSubject<boolean>(false);
      this.searchTerm$.next(''); //= new Subject<string>();
    });

  }

  public selectVariable(event: ApioTreeNode, source) : void {
    if (source == 'Interest') {
      this.currentSelectedNodesInterest.push(event);
    } else if (source == 'In-Market') {
      this.currentSelectedNodesInMarket.push(event);
    }
    this.audienceService.addAudience(event.data, this.selectedSource);
  }

  public removeVariable(event: ApioTreeNode) : void {
    let isDependent: boolean = false;
    if (this.selectedSource === 'Interest') {
      this.createdAudiences.forEach(aud => aud.compositeSource.forEach(a => {
        if (a.id === event.data.digLookup.get('interest'))
          isDependent = true;
      }));
      if (isDependent) {
        this.dialogboxHeader = 'Invalid Delete!';
        this.dialogboxWarningmsg = 'Audiences used to create a Combined or Converted or Composite Audience can not be deleted.';
        this.showDialog = true;
        this.currentSelectedNodesInterest = Array.from(this.currentSelectedNodesInterest);
        this.cd.markForCheck();
      } else {
        const indexToRemove = this.currentSelectedNodesInterest.indexOf(event);
        this.currentSelectedNodesInterest.splice(indexToRemove, 1);
        this.audienceService.removeAudience(event.data, this.selectedSource);
      }
    } else if (this.selectedSource === 'In-Market') {
      this.createdAudiences.forEach(aud => aud.compositeSource.forEach(a => {
        if (a.id === event.data.digLookup.get('in_market'))
          isDependent = true;
      }));
      if (isDependent) {
        this.dialogboxHeader = 'Invalid Delete!';
        this.dialogboxWarningmsg = 'Audiences used to create a Combined or Converted or Composite Audience can not be deleted.';
        this.showDialog = true;
        this.currentSelectedNodesInMarket = Array.from(this.currentSelectedNodesInMarket);
        this.cd.markForCheck();
      } else {
        const indexToRemove = this.currentSelectedNodesInterest.indexOf(event);
        this.currentSelectedNodesInterest.splice(indexToRemove, 1);
        this.audienceService.removeAudience(event.data, this.selectedSource);
      }
    }
  }

  public onSourceChanged(source: OnlineSourceTypes) {
    this.enableSource(source, this.currentNodes);
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
        n.selectable = (n.data as OnlineAudienceDescription).hasSource(this.selectedSource);
        return searchField.toLowerCase().includes(term);
      }
    });
  }

  private enableSource(source: OnlineSourceTypes, nodes?: ApioTreeNode[]) : void {
    nodes.forEach(n => {
      if (n.leaf) {
        n.selectable = (n.data as OnlineAudienceDescription).hasSource(source);
      } else {
        this.enableSource(source, n.children);
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
    if (result && result.length && (result[0].audienceSourceName === 'In-Market' || result[0].audienceSourceName === 'Interest')) {
      if (result[0].audienceSourceName == 'In-Market') {
        this.currentSelectedNodesInMarket = this.currentSelectedNodesInMarket.filter(node => node.data.digLookup.get('in_market') != result[0].audienceIdentifier);
      } else if (result[0].audienceSourceName == 'Interest') {
        this.currentSelectedNodesInterest = this.currentSelectedNodesInterest.filter(node => node.data.digLookup.get('interest') != result[0].audienceIdentifier);
      }
      this.cd.markForCheck();
    }
  }

  private clearSelections(){
    this.currentSelectedNodesInterest = [];
    this.currentSelectedNodesInMarket = [];
    this.cd.markForCheck();
  }

  public closeDialog() {
    this.showDialog = false;
  }
}
