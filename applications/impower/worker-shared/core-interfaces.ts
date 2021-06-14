import { Observable } from 'rxjs';
import { ImpClientLocationTypeCodes } from './data-model/impower.data-model.enums';
import { ImpGeofootprintLocationPayload } from './data-model/payloads/imp-geofootprint-location-payload';
import { ImpProjectPayload } from './data-model/payloads/imp-project-payload';

export interface ObservableWorker<TPayload, TResult extends WorkerResponse> {
  start(payload: TPayload) : Observable<TResult>;
  sendNewMessage(payload: TPayload) : void;
}

type variableHandlerType<TEntity, TState> = (state: TState, data: TEntity, header: string) => any;

export interface ColumnDefinition<TEntity, TState = any> {
  header: string;
  row: number | string | variableHandlerType<TEntity, TState>;
}

export interface ExportState<TEntity> {
  getColumns() : ColumnDefinition<TEntity, ExportState<TEntity>>[];
  getRows() : TEntity[];
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

export enum WorkerProcessReturnType {
  BlobUrl,
  OutputData
}

export interface WebWorkerPayload<TEntity> {
    rows: TEntity[];
    outputType: WorkerProcessReturnType;
}
