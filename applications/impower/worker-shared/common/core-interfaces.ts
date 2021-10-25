import { Observable } from 'rxjs';

export interface ObservableWorker<TPayload, TResult> {
  workerId: string;
  start(payload: TPayload) : Observable<WorkerResponse<TResult>>;
  sendNewMessage(payload: TPayload) : void;
}

export interface DualObservableWorker<TPayload, TResult, UPayload, UResult> extends ObservableWorker<TPayload, TResult> {
  sendAlternateMessage(payload: UPayload) : Observable<WorkerResponse<UResult>>;
}

export interface DualPayload<TPayload, UPayload> {
  primary?: TPayload;
  secondary?: UPayload;
}

export interface DualResponse<TResult, UResult> {
  primary?: WorkerResponse<TResult>;
  secondary?: WorkerResponse<UResult>;
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
