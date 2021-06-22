import { Observable } from 'rxjs';

export interface ObservableWorker<TPayload, TResult> {
  workerId: string;
  start(payload: TPayload) : Observable<WorkerResponse<TResult>>;
  sendNewMessage(payload: TPayload) : void;
}

export enum WorkerStatus {
  Running = 'Running',
  Complete = 'Complete',
  Error = 'Error'
}

export interface WorkerResult {
  status: WorkerStatus;
  message: string;
  rowsProcessed: number;
}

export interface WorkerResponse<TData = any> extends WorkerResult {
  value: TData;
}
