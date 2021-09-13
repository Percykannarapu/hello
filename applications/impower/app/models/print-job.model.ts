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
