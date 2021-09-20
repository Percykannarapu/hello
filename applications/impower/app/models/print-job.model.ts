export interface PrintJobPayload {
  jobId: number;
  projectId: number;
  projectName: string;
  userName: string;
  pages: number;
  pageSize: string;
  jobNumber: string;
  createDate: Date;
  status: string;
  modifyDate: Date;
  jobType: string;
  queuePosition: string;
}

export interface PrintJobAdminRequest {
  calls: [{
    service: string,
    function: string,
    args: {}
  }];
}

export interface PrintJobAdminResponse {
  results: {
    success: boolean;
    result: PrintJobAdminStatsPayload;
  }[];
}

export interface PrintJobAdminStatsPayload {
  numPendingJobs: number;
  numRunningJobs: number;
  numPendingPages: number;
  numRunningPages: number;
  numSubmittedJobsToday: number;
  numCompletedJobsToday: number;
  numFailedJobsToday: number;
  numPagesCompletedToday: number;
  numSubmittedJobs24Hrs: number;
  numCompletedJobs24Hrs: number;
  numFailedJobs24Hrs: number;
  numPagesCompleted24Hrs: number;
  pendingJobs: PrintJobAdminPayload[];
  runningJobs: PrintJobAdminPayload[];
}

export interface PrintJobAdminPayload {
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
