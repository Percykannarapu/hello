import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { OnlineAudienceDescription, OnlineSourceTypes, TargetAudienceOnlineService } from '../../../services/target-audience-online.service';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { TreeNode } from 'primeng/primeng';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { Subject } from 'rxjs';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { AppStateService } from '../../../services/app-state.service';

const UnSelectableLimit = 1000;

@Component({
  selector: 'val-online-audience-pixel',
  templateUrl: './online-audience-pixel.component.html',
  styleUrls: ['./online-audience-pixel.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudiencePixelComponent implements OnInit {

  static sources: Set<string> = new Set<string>();

  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public currentSelectedNodes: TreeNode[];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private audienceService: TargetAudienceOnlineService,
              private parentAudienceService: TargetAudienceService,
              private cd: ChangeDetectorRef,
              private appStateService: AppStateService) {
    this.currentSelectedNodes = this.allNodes;

    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));

  }

  private static asTreeNode(variable: OnlineAudienceDescription) : TreeNode {
    this.sources.add(Array.from(variable.digLookup.keys()).join('/'));
    const selectable: boolean = (!Number.isNaN(Number(variable.taxonomy)) && Number(variable.taxonomy) > UnSelectableLimit);
    return {
      label: variable.categoryName, // This is used in selectNodes, not just for display //undefined, // template in the html markup does this since we have spacing requirements
      data: variable,
      icon: `fa fa-fontAwesome ${selectable ? 'fa fa-file-o' : 'fa fa-lock'}`,
      type: selectable ? undefined : 'disabled',
      selectable: selectable,
      leaf: true,
    };
  }

  selectNodes(audiences: AudienceDataDefinition[], ready: boolean) {
    if (!ready || audiences == null || audiences.length === 0) return;
    for (const audience of audiences) {
      const node = this.allNodes.filter(n => n.label === audience.audienceName);
      if (node != null && node.length > 0 && this.currentSelectedNodes.filter(n => n.label === node[0].label).length === 0) {
        this.currentSelectedNodes.push(node[0]);
      }
    }
    this.cd.markForCheck();
  }

  ngOnInit() {
    this.audienceService.getAudienceDescriptions([OnlineSourceTypes.Pixel]).subscribe(
      folders => folders.forEach(f => this.allNodes.push(OnlineAudiencePixelComponent.asTreeNode(f))),
      err => console.error('There was an error during retrieval of the Pixel descriptions', err),
      () => {
        this.allNodes.sort((a, b) => a.data.categoryName.localeCompare(b.data.categoryName));
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
        this.cd.markForCheck();
      });
    this.searchTerm$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));

    // this.appStateService.clearUI$.subscribe(() => this.clearSelectedFields());

    // this.parentAudienceService.audiences$.pipe(
    //   map(audiences => audiences.filter(a => a.audienceSourceType === 'Online' && a.audienceSourceName === OnlineSourceTypes.Pixel))
    // ).subscribe(audiences => console.log('### Hawkman - pixel audiences:', audiences));

    this.parentAudienceService.audiences$.pipe(
      map(audiences => audiences.filter(a => a.audienceSourceType === 'Online' && a.audienceSourceName === OnlineSourceTypes.Pixel))
    ).subscribe(audiences => this.selectNodes(audiences, true));
  }

  public selectVariable(event: TreeNode) : void {
    this.currentSelectedNodes.push(event);
    this.audienceService.addAudience(event.data, OnlineSourceTypes.Pixel);
    // const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: 'checked' });
    // const metricText = `${event.data.digCategoryId}~${event.data.categoryName}~Pixel~${this.appStateService.analysisLevel$.getValue()}`;
  }

  public removeVariable(event: TreeNode) : void {
    const indexToRemove = this.currentSelectedNodes.indexOf(event);
    this.currentSelectedNodes.splice(indexToRemove, 1);
    this.audienceService.removeAudience(event.data, OnlineSourceTypes.Pixel);
    // const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: 'unchecked' });
    // const metricText = `${event.data.digCategoryId}~${event.data.categoryName}~Pixel~${this.appStateService.analysisLevel$.getValue()}`;
  }

  public formatCount(number: string) {
    return Number.isNaN(Number(number)) ? 'n/a' : Number(number).toLocaleString();
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
    this.currentSelectedNodes = this.currentSelectedNodes.filter(node => node.data.categoryId !== result[0].audienceIdentifier);
    this.cd.markForCheck();
  }

  private clearSelectedFields(){
      this.currentSelectedNodes = [];
      this.cd.markForCheck();
  }

}
