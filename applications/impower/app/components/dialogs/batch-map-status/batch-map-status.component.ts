import { Component, OnInit, ViewChild } from '@angular/core';
import { Store } from '@ngrx/store';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { BatchMapService } from 'app/services/batch-map.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { DynamicDialogConfig } from 'primeng/dynamicdialog';
import { Table } from 'primeng/table';
import { SimpleGridColumn } from '../../../common/ui-helpers';
import { PrintJobPayload } from '../../../models/print-job.model';
import { FileService } from '../../../val-modules/common/services/file.service';

@Component({
  selector   : 'val-batch-map-status',
  templateUrl: './batch-map-status.component.html',
  styleUrls  : ['./batch-map-status.component.scss']
})
export class BatchMapStatusComponent implements OnInit {

  @ViewChild('statusTable', { static: true }) public statusTable: Table;

  public gettingData: boolean;
  public printJobDetails: PrintJobPayload[] = [];
  public allColumns: SimpleGridColumn[] = [
    // @formatter:off
    { field: 'projectId',     header: 'Project ID',          width: '5rem', sortable: true  },
    { field: 'projectName',   header: 'Project Name',        width: null,   sortable: true  },
    { field: 'pages',         header: 'No of Pages',         width: '5rem', sortable: true  },
    { field: 'pageSize',      header: 'Page Size',           width: '8rem', sortable: true  },
    { field: 'jobType',       header: 'Job Type',            width: '10rem', sortable: true  },
    { field: 'jobNumber',     header: 'Job Id',              width: '6rem', sortable: false },
    { field: 'createDate',    header: 'Date/Time Requested', width: '10rem', sortable: true  },
    { field: 'status',        header: 'Status',              width: '8rem', sortable: true  },
    { field: 'queuePosition', header: 'Queue Position',      width: '5rem', sortable: true  },
    // @formatter:on
  ];

  public actionsAvailable = new Set(['Running', 'Pending']);
  public downloadDisabled = new Set(['Running', 'Pending', 'Failed', 'Canceled']);

  constructor(private batchService: BatchMapService,
              private ddConfig: DynamicDialogConfig,
              private store$: Store<LocalAppState>) {
  }

  ngOnInit() {
    this.gettingData = true;
    setTimeout(() => this.refreshData());
  }

  private refreshData() {
    this.batchService.getBatchMapDetailsByUser(this.ddConfig.data.user).subscribe(response => {
      this.printJobDetails = Array.from(response);
      this.gettingData = false;
    });
  }

  cancel(job: PrintJobPayload) {
    this.batchService.cancelBatchMapInProcess(job.jobId).subscribe(response => {
      this.printJobDetails = [response].concat(this.printJobDetails.filter(jd => jd.jobId === response.jobId));
    });
  }

  refresh(job: PrintJobPayload) {
    this.batchService.getBatchMapDetailsById(job.jobId).subscribe(response => {
      this.printJobDetails = [response].concat(this.printJobDetails.filter(jd => jd.jobId === response.jobId));
    });
  }

  downloadPdf(job: PrintJobPayload) {
    this.store$.dispatch(new StartBusyIndicator({ key: 'PdfDownload', message: `PDF downloading` }));
    setTimeout(() => {
      this.batchService.downloadBatchMapPdf(job.jobNumber).subscribe(data => {
        FileService.downloadRawBlob(data, `${job.jobNumber}.pdf`, 'application/pdf');
        this.store$.dispatch(new StopBusyIndicator({ key: 'PdfDownload' }));
      });
    });
  }

  downloadZIP(job: PrintJobPayload) {
    this.store$.dispatch(new StartBusyIndicator({ key: 'ZipDownload', message: `ZIP downloading` }));
    setTimeout(() => {
      this.batchService.downloadBatchMapZip(job.jobNumber).subscribe(data => {
        FileService.downloadRawBlob(data, `${job.projectId}_all_sites.zip`);
        this.store$.dispatch(new StopBusyIndicator({ key: 'ZipDownload' }));
      });
    });
  }

  copy(job: PrintJobPayload) {
    window.navigator.clipboard.writeText(job.jobNumber).catch(e => console.error('There was an error copying data to the clipboard:', e));
  }
}
