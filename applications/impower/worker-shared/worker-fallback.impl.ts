import { Observable, Subscriber } from 'rxjs';
import { ObservableWorker, WorkerResponse, WorkerStatus } from './core-interfaces';
import { isNil } from './export-helpers';

export class ObservableWorkerFallback<TPayload, TResult extends WorkerResponse>
  implements ObservableWorker<TPayload, TResult> {

  private observer: Subscriber<TResult>;

  constructor(private processor: (payload: TPayload) => TResult) {
  }

  public start(payload: TPayload) : Observable<TResult> {
    return new Observable(o => {
      const result = this.processor(payload);
      this.observer = o;
      this.send(result);
      return () => this.observer = null;
    });
  }

  public sendNewMessage(payload: TPayload) : void {
    const result = this.processor(payload);
    this.send(result);
  }

  private send(result: TResult) : void {
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
