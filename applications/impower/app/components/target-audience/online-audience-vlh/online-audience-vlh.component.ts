import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, map } from 'rxjs/operators';
import { AudienceDataDefinition } from '../../../models/audience-data.model';
import { OnlineAudienceDescription, OnlineSourceTypes, TargetAudienceOnlineService } from '../../../services/target-audience-online.service';
import { TargetAudienceService } from '../../../services/target-audience.service';
import { LoggingService } from '../../../val-modules/common/services/logging.service';
import { AppStateService } from 'app/services/app-state.service';

@Component({
  selector: 'val-online-audience-vlh',
  templateUrl: './online-audience-vlh.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnlineAudienceVlhComponent implements OnInit, AfterViewInit {

  static sources: Set<string> = new Set<string>();

  private allNodes: TreeNode[] = [];
  public currentNodes: TreeNode[] = [];
  public currentSelectedNodes: TreeNode[] = [];

  public loading: boolean = true;
  public searchTerm$: Subject<string> = new Subject<string>();

  constructor(private audienceService: TargetAudienceOnlineService,
              private parentAudienceService: TargetAudienceService,
              private cd: ChangeDetectorRef,
              private appStateService: AppStateService,
              private logger: LoggingService) {
    this.parentAudienceService.deletedAudiences$.subscribe(result => this.syncCheckData(result));
  }

  private static asTreeNode(variable: OnlineAudienceDescription) : TreeNode {
    this.sources.add(Array.from(variable.digLookup.keys()).join('/'));
    return {
      label: variable.categoryName,
      data: variable,
      icon: 'fa fa-file-o',
      leaf: true,
    };
  }

  ngOnInit() {
    this.searchTerm$.pipe(
      debounceTime(250),
      distinctUntilChanged()
    ).subscribe(term => this.filterNodes(term));

    // this.appStateService.clearUI$.subscribe(() => this.clearSelectedFields());

    this.parentAudienceService.allAudiencesBS$.pipe(
      map(audiences => audiences.filter(a => a.audienceSourceType === 'Online' && a.audienceSourceName === 'VLH'))
    ).subscribe(audiences => this.selectNodes(audiences, true));

    this.appStateService.clearUI$.subscribe(() =>  this.searchTerm$.next(''));

    /*combineLatest(this.parentAudienceService.audiences$, this.appStateService.applicationIsReady$).pipe(
      map(([audiences, ready]) => audiences.filter(a => a.audienceSourceType === 'Online' && a.audienceSourceName === 'VLH')),
      distinctUntilChanged()
    ).subscribe(([audiences, ready]) => this.selectNodes(audiences, ready));*/
  }

  selectNodes(audiences: AudienceDataDefinition[], ready: boolean) {
    this.clearSelectedFields();
    if (!ready || audiences == null || audiences.length === 0) return;
    for (const audience of audiences) {
      const node = this.allNodes.filter(n => n.label === audience.audienceName);
      if (node.length > 0 && this.currentSelectedNodes.filter(n => n.label === node[0].label).length === 0) {
        this.currentSelectedNodes.push(node[0]);
      }
      else{
        this.appStateService.currentProject$.getValue().impProjectVars.forEach(v => {
            if (v.varPk.toString() === audience.audienceIdentifier)
                v.isActive = false;
        });
      }
    }
    this.cd.markForCheck();
  }

  ngAfterViewInit() : void {
    this.audienceService.getAudienceDescriptions([OnlineSourceTypes.VLH])
    .pipe(
      map(folders => folders.filter(f => f.isLeaf && !f.categoryName.match('-canada$') && !f.categoryName.match('-uk$') && !f.categoryName.match('_canada$') && !f.categoryName.match('_uk$')))
    )
    .subscribe(
      folders => {
        folders.forEach(f => this.allNodes.push(OnlineAudienceVlhComponent.asTreeNode(f)));
      },
      err => this.logger.error.log('There was an error during retrieval of the VLH descriptions', err),
      () => {
        this.allNodes.sort((a, b) => a.leaf === b.leaf ? a.label.localeCompare(b.label) : a.leaf ? 1 : -1);
        this.currentNodes = Array.from(this.allNodes);
        this.loading = false;
        this.cd.markForCheck();
      });
  }

  public selectVariable(event: TreeNode) : void {
   /* const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: 'checked' });
    const metricText = `${event.data.digCategoryId}~${event.data.categoryName}~Visit Likelihood~${this.appStateService.analysisLevel$.getValue()}`;
    this.usageService.createCounterMetric(usageMetricName, metricText, null);*/
    this.currentSelectedNodes.push(event);
    this.audienceService.addAudience(event.data, OnlineSourceTypes.VLH);
  }

  public removeVariable(event: TreeNode) : void {
    // const usageMetricName = new ImpMetricName({ namespace: 'targeting', section: 'audience', target: 'online', action: 'unchecked' });
    // const metricText = `${event.data.digCategoryId}~${event.data.categoryName}~Visit Likelihood~${this.appStateService.analysisLevel$.getValue()}`;
    // this.usageService.createCounterMetric(usageMetricName, metricText, null);
    const indexToRemove = this.currentSelectedNodes.indexOf(event);
    this.currentSelectedNodes.splice(indexToRemove, 1);
    this.audienceService.removeAudience(event.data, OnlineSourceTypes.VLH);
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
    this.currentSelectedNodes = this.currentSelectedNodes.filter(node => node.data.digLookup.get('vlh') != result[0].audienceIdentifier);
    this.cd.markForCheck();
  }

  private clearSelectedFields(){
    this.currentSelectedNodes = [];
    this.cd.markForCheck();
  }
}
