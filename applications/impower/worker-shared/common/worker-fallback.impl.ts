import { isNil } from '@val/common';
import { Observable, Subscriber } from 'rxjs';
import { ObservableWorker, WorkerResponse, WorkerStatus } from './core-interfaces';

export class ObservableWorkerFallback<TPayload, TResult>
  implements ObservableWorker<TPayload, TResult> {

  private observer: Subscriber<WorkerResponse<TResult>>;

  constructor(processor: (payload: TPayload) => WorkerResponse<TResult>, isAsync: false, workerId: string);
  constructor(processor: (payload: TPayload) => Promise<WorkerResponse<TResult>>, isAsync: true, workerId: string);
  constructor(private processor: ((payload: TPayload) => WorkerResponse<TResult>) | ((payload: TPayload) => Promise<WorkerResponse<TResult>>), private isAsync: boolean, public workerId: string) {
  }

  public start(payload: TPayload) : Observable<WorkerResponse<TResult>> {
    return new Observable(o => {
      this.observer = o;
      const result = this.processor(payload);
      if (this.isAsync) {
        (result as Promise<WorkerResponse<TResult>>).then(resultData => this.send(resultData));
      } else {
        this.send(result as WorkerResponse<TResult>);
      }
      return () => this.observer = null;
    });
  }

  public sendNewMessage(payload: TPayload) : void {
    const result = this.processor(payload);
    if (this.isAsync) {
      (result as Promise<WorkerResponse<TResult>>).then(resultData => this.send(resultData));
    } else {
      this.send(result as WorkerResponse<TResult>);
    }
  }

  private send(result: WorkerResponse<TResult>) : void {
    if (!isNil(this.observer)) {
      switch (result.status) {
        case WorkerStatus.Running:
          this.observer.next(result);
          break;
        case WorkerStatus.Complete:
          this.observer.next(result);
          this.observer.complete();
          break;
        case WorkerStatus.Error:
          this.observer.error(result);
      }
    } else {
      console.warn('Fallback Worker send message called after observable completion. Payload:', result);
    }
  }
}
