import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { Store } from '@ngrx/store';
import { LocalAppState, PrintAdminPayload } from 'app/state/app.interfaces';
import { getBatchMapAdminDialog } from 'app/state/batch-map/batch-map.selectors';
import { BatchMapAdminDialogClose } from 'app/state/batch-map/batch-map.actions';
import { BatchMapService } from 'app/services/batch-map.service';
import { TreeNode } from 'primeng/api';

@Component({
  selector: 'val-admin-dialog',
  templateUrl: './admin-dialog.component.html',
  styleUrls: ['./admin-dialog.component.scss']
})
export class AdminDialogComponent implements OnInit {
  
  showDialog: boolean = false;
  public adminJobDetails: ImpAdminJob[] = [];
  statsData: TreeNode[] ;
  inprocessData: TreeNode[];

  console = console;

  inprocessColumns: any[] = [
    {field: 'skip',                       header: '                 ',      size: '8%' },
    {field: 'shortJobNum',                header: 'Job Number',             size: '8%' },
    {field: 'jobId',                      header: 'Job Id',                 size: '8%' },
    {field: 'projectId',                  header: 'Project Id',             size: '8%' },
    {field: 'totalPages',                 header: 'Total Pages',            size: '8%' },
    {field: 'completedPages',             header: 'Completed Pages',        size: '8%' },
    {field: 'errorPages',                 header: 'ErrorPages',             size: '8%' },
    {field: 'pendingPages',               header: 'Pending Pages',          size: '8%' },
    {field: 'username',                   header: 'User',                   size: '8%' },
    {field: 'pageSize',                   header: 'page Size',              size: '8%' },
    {field: 'queuePosition',              header: 'QPosition',              size: '8%' },
    {field: 'cancel',                     header: 'Cancel',                 size: '8%' }
    /*{ field: 'numPendingJobs',                header: 'Pending Jobs',           size: '8%'   },
    { field: 'numRunningJobs',                header: 'Running Jobs',           size: '8%'   },
    { field: 'numPendingPages',               header: 'Pending Pages',           size: '8%'  },
    { field: 'numRunningPages',               header: 'Running Pages',           size: '8%'  },
    { field: 'numSubmittedJobsToday',         header: 'SubmittedJobs Today',     size: '15%' },
    { field: 'numCompletedJobsToday',         header: 'CompletedJobs Today',     size: '15%' },
    { field: 'numFailedJobsToday',            header: 'FailedJobs Today',        size: '15%' },
    { field: 'numPagesCompletedToday',        header: 'PagesCompleted Today',    size: '15%'} */
  ];
  
  statsColumns: any[] = [
    {field: 'name', header: 'Name'},
    {field: 'count', header: 'Counts'}
  ];

  statsNames: any  = {
    numPendingJobs          : 'Pending Jobs',
    numRunningJobs          : 'Running Jobs',
    numPendingPages         : 'Pending Pages',
    numRunningPages         : 'Running Pages',
    numSubmittedJobsToday   : 'SubmittedJobs Today',
    numCompletedJobsToday   : 'CompletedJobs Today',
    numFailedJobsToday      : 'FailedJobs Today',
    numPagesCompletedToday  : 'PagesCompleted Today' ,
    numSubmittedJobs24Hrs   : 'Submitted Jobs in 24 Hrs' ,
    numCompletedJobs24Hrs   : 'Completed Jobs in 24 Hrs',
    numFailedJobs24Hrs      : 'Failed Jobs in 24 Hrs',
    numPagesCompleted24Hrs  : 'Pages Completed in 24 Hrs' 
  };

  constructor(private store$: Store<LocalAppState>,
              private batchMapService: BatchMapService,
              private cd: ChangeDetectorRef) { }

  ngOnInit() {
    this.store$.select(getBatchMapAdminDialog).subscribe(flag => {
      this.showDialog = flag;
      if (flag){
        this.batchMapService.requestPrintAdminStatus(this.printAdminPayload()).subscribe(payload => {
          //this.loadAdminPayload(data1['results'][0].result);
          const mapPayload = payload['results'][0].result as Record<string, any>;
          this.getDataTree(mapPayload);
          this.cd.markForCheck();
        });
      }

    });
  }

  closeDialog (){
    this.store$.dispatch(new BatchMapAdminDialogClose());
  }

  private getDataTree(payload: Record<string, any>){
    const inProcessResult: TreeNode[] = [];
    const stats: any[] = [];
    
    Object.keys(payload).map(key => {
        if (key !== 'runningJobs' && key != 'pendingJobs'){
          stats.push({name : key, value: payload[key]});
        }
        if (key === 'runningJobs'){
          inProcessResult.push(this.buildRootNode(payload[key], 'Running Jobs'));
        }

        if (key === 'pendingJobs')    
            inProcessResult.push(this.buildRootNode(payload[key], 'Pending Jobs')); 
          
    });
    this.statsData = [this.buildStatsTreeNode(stats)]; 
    this.inprocessData = inProcessResult;
    this.cd.markForCheck();
  }

  private buildStatsTreeNode(statsData: any[]) : TreeNode{
      const statsNodeTree: any [] = [];
    return {
      data: {
        name: 'Stats',
        value: ''
      },
      leaf: false,
      expanded : false,
      children:  statsData.map(s => this.buildNodes(s.name, s.value, true ))
    };
  }

  private buildRootNode(inProcessJobs: ImpAdminJob[], header: string) : TreeNode{
    
    return {
      data : {
        name: header,
        value: ''
      },
      leaf: false,
      expanded: false,
      children: this.getTreeNodes( inProcessJobs, header)
    };
  }

  private getTreeNodes( value: ImpAdminJob[], header: string) : TreeNode []{
    const treeNodes: TreeNode[] = [];
    /*Object.keys(value).map(key => {
      treeNodes.push(this.buildTableTree(key, value[key], true));
    });*/
    value.forEach(record => treeNodes.push(this.buildTableTree(record, true)));
  return treeNodes;
}

  showCancelButton(event: TreeNode){
    return event.data;
  }

  buildTableTree(value: ImpAdminJob, isLeaf: boolean = true) : TreeNode {
    return {
      data: {
        jobId: value.jobId,
        projectId : value.projectId,
        totalPages: value.totalPages,
        completedPages: value.completedPages,
        errorPages: value.errorPages,
        pendingPages: value.pendingPages,
        username: value.username.split('@')[0],
        pageSize: value.pageSize,
        queuePosition: value.queuePosition,
        jobType: value.jobType,
        showCancel: true,
        shortJobNum: value.jobNumber.substring(0, 7),
        jobNumber: value.jobNumber
        //shortJobId: value.jobId.substring(0, 7)
      },
      leaf: isLeaf
    };
  }

  buildNodes(key: string, value: any, isLeaf: boolean = true) : TreeNode{
    return {
      data: {
        name: this.statsNames[key],
        value: value,
        isNumber: true,
      },
      leaf: isLeaf
    };
  }

  printAdminPayload(){
    const printAdminPayload: PrintAdminPayload = {
      calls : [{
        service: 'PrintAdmin',
          function: 'getQueueStats',
          args: {}
      }]
    };

    return printAdminPayload;
  }

  cancel(event: any){
    this.batchMapService.cancelBatchMapInProcess(event.jobId).subscribe(() => {} , () => {}, () => {
      this.batchMapService.requestPrintAdminStatus(this.printAdminPayload()).subscribe(payload => {
        const mapPayload = payload['results'][0].result as Record<string, any>;
        this.getDataTree(mapPayload);
        this.cd.markForCheck();
      });
    });
  }

  copy(val: string){
    const selBox = document.createElement('textarea');
    selBox.style.position = 'fixed';
    selBox.style.left = '0';
    selBox.style.top = '0';
    selBox.style.opacity = '0';
    selBox.value = val;
    document.body.appendChild(selBox);
    selBox.focus();
    selBox.select();
    document.execCommand('copy');
    document.body.removeChild(selBox);
}

}

export interface ImpAdminJob{
  jobId?: number;
  projectId?: number;
  totalPages?: number;
  completedPages?: number;
  errorPages?: number;
  pendingPages?: number;
  username?: string;
  pageSize?: string;
  queuePosition?: string;
  jobType: string;
  shortJobNum?: string;
  jobNumber?: string;
}

