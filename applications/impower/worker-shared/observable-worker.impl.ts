import { isNil, isNotNil } from '@val/common';
import { Observable, Subscriber, throwError } from 'rxjs';
import { ObservableWorker, WorkerResponse, WorkerStatus } from './core-interfaces';

export class ObservableWebWorker<TPayload, TResult extends WorkerResponse>
  implements ObservableWorker<TPayload, TResult> {

  private isStarted = false;
  private isTerminated = false;

  constructor(private workerInstance: Worker) {
  }

  private setup(observer: Subscriber<TResult>) {
    this.workerInstance.onmessage = ({data}: { data: TResult }) => {
      switch (data.status) {
        case WorkerStatus.Running:
          observer.next(data);
          break;
        case WorkerStatus.Complete:
          observer.next(data);
          observer.complete();
          break;
        case WorkerStatus.Error:
          observer.error(data);
      }
    };
    this.workerInstance.onmessageerror = (err) => observer.error(err);
  }

  private cleanup() {
    this.isStarted = false;
    this.isTerminated = true;
    this.workerInstance.terminate();
    this.workerInstance = null;
  }

  public start(payload: TPayload) : Observable<TResult> {
    if (this.isStarted) {
      return throwError('This web worker instance has already started');
    }
    if (isNil(this.workerInstance)) {
      if (this.isTerminated) {
        throw new Error('This instance has already terminated');
      } else {
        return throwError('This browser does not support Web Workers');
      }
    }
    return new Observable(observer => {
      this.setup(observer);
      this.isStarted = true;
      this.workerInstance.postMessage(payload);
      return () => this.cleanup();
    });
  }

  public sendNewMessage(payload: TPayload) : void {
    if (isNotNil(this.workerInstance) && this.isStarted) {
      this.workerInstance.postMessage(payload);
    }
  }
}
