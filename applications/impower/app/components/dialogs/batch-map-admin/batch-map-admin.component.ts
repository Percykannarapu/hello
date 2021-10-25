import { Component, OnInit } from '@angular/core';
import { BatchMapService } from 'app/services/batch-map.service';
import { TreeNode } from 'primeng/api';
import { finalize } from 'rxjs/operators';
import { SimpleGridColumn } from '../../../../worker-shared/data-model/custom/grid';
import { PrintJobAdminPayload, PrintJobAdminRequest, PrintJobAdminStatsPayload } from '../../../common/models/print-job.model';

interface StatRow {
  name: string;
  value: number;
}

@Component({
  templateUrl: './batch-map-admin.component.html',
  styleUrls  : ['./batch-map-admin.component.scss']
})
export class BatchMapAdminComponent implements OnInit {

  gettingData: boolean = true;
  statsData: StatRow[];
  jobData: TreeNode[];

  jobColumns: SimpleGridColumn[] = [
    // @formatter:off
    { field: 'shortJobNum',    header: 'Job Number',      width: '8%' },
    { field: 'jobId',          header: 'Job Id',          width: '8%' },
    { field: 'projectId',      header: 'Project Id',      width: '8%' },
    { field: 'totalPages',     header: 'Total Pages',     width: '8%' },
    { field: 'completedPages', header: 'Completed Pages', width: '8%' },
    { field: 'errorPages',     header: 'ErrorPages',      width: '8%' },
    { field: 'pendingPages',   header: 'Pending Pages',   width: '8%' },
    { field: 'username',       header: 'User',            width: '8%' },
    { field: 'pageSize',       header: 'page Size',       width: '8%' },
    { field: 'queuePosition',  header: 'QPosition',       width: '8%' },
    { field: 'cancel',         header: '',                width: '8%' }
    // @formatter:on
  ];

  statNames = {
    numPendingJobs        : 'Pending Jobs',
    numRunningJobs        : 'Running Jobs',
    numPendingPages       : 'Pending Pages',
    numRunningPages       : 'Running Pages',
    numSubmittedJobsToday : 'Submitted Jobs Today',
    numCompletedJobsToday : 'Completed Jobs Today',
    numFailedJobsToday    : 'Failed Jobs Today',
    numPagesCompletedToday: 'Pages Completed Today',
    numSubmittedJobs24Hrs : 'Submitted Jobs in 24 Hrs',
    numCompletedJobs24Hrs : 'Completed Jobs in 24 Hrs',
    numFailedJobs24Hrs    : 'Failed Jobs in 24 Hrs',
    numPagesCompleted24Hrs: 'Pages Completed in 24 Hrs'
  };

  private requestPayload: PrintJobAdminRequest = {
    calls: [
      {
        service : 'PrintAdmin',
        function: 'getQueueStats',
        args    : {}
      }
    ]
  };

  constructor(private batchMapService: BatchMapService) {}

  ngOnInit() {
    this.gettingData = true;
    // by using setTimeout here, we ensure that the spinner will display, even if the http request happens rapidly
    setTimeout(() => {
      this.batchMapService.requestPrintAdminStatus(this.requestPayload).subscribe(response => {
        this.processData(response?.results?.[0]?.result);
        this.gettingData = false;
      });
    });
  }

  private processData(payload: PrintJobAdminStatsPayload) {
    const jobs: TreeNode[] = [];
    const stats: StatRow[] = [];

    Object.keys(payload).forEach(key => {
      switch (key) {
        case 'pendingJobs':
          jobs.push(this.buildRootNode(payload[key], 'Pending Jobs'));
          break;
        case 'runningJobs':
          jobs.push(this.buildRootNode(payload[key], 'Running Jobs'));
          break;
        default:
          stats.push({ name: key, value: payload[key] });
      }
    });
    this.statsData = stats;
    this.jobData = jobs;
  }

  private buildRootNode(jobs: PrintJobAdminPayload[], header: string) : TreeNode {
    return {
      data    : {
        name : header,
        value: ''
      },
      leaf    : false,
      expanded: false,
      children: jobs.map(job => this.buildTableTree(job))
    };
  }

  buildTableTree(value: PrintJobAdminPayload) : TreeNode {
    return {
      leaf: true,
      data: {
        ...value,
        username: value.username.split('@')[0],
      },
    };
  }

  cancel(job: PrintJobAdminPayload) {
    this.batchMapService.cancelBatchMapInProcess(job.jobId).pipe(
      finalize(() => this.ngOnInit())
    ).subscribe();
  }

  copy(val: string) {
    window.navigator.clipboard.writeText(val).catch(console.error);
  }
}
