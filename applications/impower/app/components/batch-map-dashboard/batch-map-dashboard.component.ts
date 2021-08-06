import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { StartBusyIndicator, StopBusyIndicator } from '@val/messaging';
import { AppConfig } from 'app/app.config';
import { AppStateService } from 'app/services/app-state.service';
import { BatchMapService } from 'app/services/batch-map.service';
import { UserService } from 'app/services/user.service';
import { LocalAppState } from 'app/state/app.interfaces';
import { CloseBatchMapStatusDialog } from 'app/state/batch-map/batch-map.actions';
import { getBatchMapStatusDialog } from 'app/state/batch-map/batch-map.selectors';
import { RestDataService } from 'app/val-modules/common/services/restdata.service';
import moment from 'moment';
import { Observable } from 'rxjs';
import { filter, take } from 'rxjs/operators';

@Component({
  selector: 'val-batch-map-dashboard',
  templateUrl: './batch-map-dashboard.component.html',
  styleUrls: ['./batch-map-dashboard.component.scss']
})
export class BatchMapDashboardComponent implements OnInit {
  showBatchMapStatusDialog$: Observable<boolean>;

  showDialog: boolean = false;
  public selectedRow: Partial<any> = null;
  public dataObs$: Observable<any[]>;
  printJobDetails: ImpPrintJob[] = [];
  public gettingData: boolean;
  allColumns: any[] = [
    //{ field: 'expand',                   header: '  ',                   size: '3%'  },
    { field: 'projectId',                header: 'Project ID',           size: '8%'  },
    { field: 'projectName',              header: 'Project Name',         size: '15%' },
    { field: 'pages',                    header: 'No of Pages',          size: '10%' },
    { field: 'pageSize',                 header: 'Page Size',            size: '10%' },
    { field: 'jobType',                  header: 'Job Type',             size: '18%' },
    { field: 'jobNumber',                header: 'Print job Number',     size: '15%' },
    { field: 'createDate',               header: 'Date/Time of request', size: '20%' },
    { field: 'elapsedTime',              header: 'Elapsed Time',         size: '12%' },
    { field: 'queuePosition',            header: 'Queue Position',       size: '15%' },
    { field: 'status',                   header: 'Status',               size: '20%' },
    { field: 'url',                      header: 'URL',                  size: '20%' },
    { field: 'refresh',                  header: 'Refresh',              size: '8%' },
    { field: 'cancel',                   header: 'Cancel',               size: '12%' }
  ];

  constructor(private store$: Store<LocalAppState>,
              private restService: RestDataService,
              private http: HttpClient,
              private stateService: AppStateService,
              private config: AppConfig,
              private userService: UserService,
              private cd: ChangeDetectorRef,
              private batMapService: BatchMapService) {}

  ngOnInit() {

    this.showBatchMapStatusDialog$ = this.store$.select(getBatchMapStatusDialog);
    this.store$.select(getBatchMapStatusDialog).subscribe( flag => {
      this.showDialog = flag;
      if (flag){
         this.batMapService.getBatchMapDetailsByUser(this.userService.getUser()).subscribe((data) => {
            const details: ImpPrintJob[] = data as ImpPrintJob[];
            this.getPrintJobDetails(details);
          });
          this.cd.markForCheck();
      }
    });

    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
      take(1),
    ).subscribe(() => {
      this.batMapService.getBatchMapDetailsByUser(this.userService.getUser()).subscribe((data) => {
          const details: ImpPrintJob[] = data as ImpPrintJob[];
          this.getPrintJobDetails(details);
        });
    });
  }

  cancel(event: ImpPrintJob){
    this.batMapService.cancelBatchMapInProcess(event.jobId).subscribe((data) => {
      const printJob = data as ImpPrintJob;
      this.printJobDetails.forEach((val) => {
          if (val.jobId == printJob.jobId){
                val.refresh = !(printJob.status === 'Running' || printJob.status === 'Pending');
                val.status = printJob.status;
                val.jobNumShort = val.jobNumber.substring(0, 7);
                printJob.modifyDate = printJob.modifyDate == null ? printJob.createDate : printJob.modifyDate;
                const duration = moment.duration(moment(printJob.modifyDate).diff(moment(printJob.createDate)));
                val.elapsedTimeTooltip = `hours: ${duration.get('hours')} minutes: ${duration.get('minutes')} seconds: ${duration.get('seconds')}`;
                val.elapsedTime = `${duration.asMinutes().toFixed()} minutes`;
                val.createDate = printJob.createDate;
                val.userName = printJob.userName.split('@')[0];
          }
      });
      this.cd.markForCheck();
    });
  }

  refresh(event: ImpPrintJob){
    this.batMapService.getBatchMapDetailsById(event.jobId).subscribe((data) => {
      const printJob = data as ImpPrintJob;
      this.printJobDetails.forEach((val) => {
          if (val.jobId == printJob.jobId){
                val.refresh = !(printJob.status === 'Running' || printJob.status === 'Pending');
                val.status = printJob.status;
                val.jobNumShort = val.jobNumber.substring(0, 7);
                printJob.modifyDate = printJob.modifyDate == null ? printJob.createDate : printJob.modifyDate;
                const duration = moment.duration(moment(printJob.modifyDate).diff(moment(printJob.createDate)));
                val.elapsedTimeTooltip = `hours: ${duration.get('hours')} minutes: ${duration.get('minutes')} seconds: ${duration.get('seconds')}`;
                val.elapsedTime = `${duration.asMinutes().toFixed()} minutes`;
                val.createDate = printJob.createDate;
                val.userName = printJob.userName.split('@')[0];
          }
      });
      this.cd.markForCheck();
    });
  }


  private getPrintJobDetails(data: ImpPrintJob[]){
    this.printJobDetails = data.sort((a, b) => {
      return b.createDate - a.createDate;
    } );
    data.forEach((val) => {
      val.url = `${this.config.printServiceUrl}/printjob/${val.jobNumber}`;
      if (val.jobType === 'One Site per Page')
          val.zipUrl = `${val.url}/zip`;
      else
          val.zipUrl = null;

      val.jobNumShort = val.jobNumber.substring(0, 7);
      val.refresh = !(val.status === 'Running' || val.status === 'Pending');
      val.modifyDate = val.modifyDate == null ? val.createDate : val.modifyDate;
      const duration = moment.duration(moment(val.modifyDate).diff(moment(val.createDate)));
      val.elapsedTimeTooltip = `hours: ${duration.get('hours')} minutes: ${duration.get('minutes')} seconds: ${duration.get('seconds')}`;
      val.elapsedTime = `${duration.asMinutes().toFixed()} minutes`;
      val.userName = val.userName.split('@')[0];
    });
    this.cd.markForCheck();
  }

  closeDialog (){
    this.store$.dispatch(new CloseBatchMapStatusDialog());
  }

  refreshButton(event: ImpPrintJob){
    return !(event.status === 'Running' || event.status === 'Pending');
  }

  isDisable(event: ImpPrintJob){
    return !(event.status === 'Running' || event.status === 'Pending' || event.status === 'Failed' || event.status == 'Canceled');
  }

  validateZipUrl(impPrintJob: ImpPrintJob){
    return this.isDisable(impPrintJob) && impPrintJob.jobType === 'One Site per Page';
  }

  downloadPdf(url: string, jobNumber: string){
    this.store$.dispatch(new StartBusyIndicator({ key: 'PdfDownload', message: `PDF downloading`}));
    this.batMapService.downloadBatchmap(url).subscribe(data => {
        const newBlob = new Blob([data], { type: 'application/pdf' });
        const uri = window.URL.createObjectURL(newBlob);
        const link = document.createElement('a');
        link.href = uri;
        link.download = `${jobNumber}.pdf`;
        link.dispatchEvent(new MouseEvent('click', { bubbles: true, cancelable: true, view: window }));
        this.store$.dispatch(new StopBusyIndicator({ key: 'PdfDownload' }));
    });
  }

  downloadZIP(url: string, impPrintJob: ImpPrintJob){
    this.store$.dispatch(new StartBusyIndicator({ key: 'ZipDownload', message: `ZIP downloading`}));
    this.batMapService.downloadZipBatchmap(url).subscribe(data => {
      const uri = window.URL.createObjectURL(new Blob([data]));
      const link = document.createElement('a');
      link.href = uri;
      link.setAttribute('download', `${impPrintJob.projectId}_all_sites.zip`);
      document.body.appendChild(link);
      link.click();
      this.store$.dispatch(new StopBusyIndicator({ key: 'ZipDownload' }));
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

export interface ImpPrintJob {
  jobId;
  projectId;
  projectName;
  userName;
  pages;
  pageSize;
  jobNumber;
  createDate;
  elapsedTime;
  status;
  url;
  refresh;
  modifyDate;
  elapsedTimeTooltip;
  jobType;
  zipUrl;
  jobNumShort;
  queuePosition;
}



