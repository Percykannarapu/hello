import { isNil, isNotNil } from '@val/common';
import { Observable, Subscriber, throwError } from 'rxjs';
import { DualObservableWorker, DualResponse, WorkerResponse, WorkerStatus } from './core-interfaces';

export class DualObservableWebWorker<TPayload, TResult, UPayload, UResult>
  implements DualObservableWorker<TPayload, TResult, UPayload, UResult> {

  private isStarted = false;
  private isTerminated = false;

  private primaryObserver: Subscriber<WorkerResponse<TResult>>;
  private secondaryObserver: Subscriber<WorkerResponse<UResult>>;

  constructor(private workerInstance: Worker, public workerId: string) {
  }

  private static notifyObserver<T>(observer: Subscriber<WorkerResponse<T>>, data: WorkerResponse<T>) {
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
  }

  private setup() {
    this.workerInstance.onmessage = ({data}: { data: DualResponse<TResult, UResult> }) => {
      if (isNotNil(data?.primary) && isNotNil(this.primaryObserver) && this.isStarted) {
        DualObservableWebWorker.notifyObserver(this.primaryObserver, data.primary);
      }
      if (isNotNil(data?.secondary) && this.isStarted) {
        if (isNotNil(this.secondaryObserver)) {
          DualObservableWebWorker.notifyObserver(this.secondaryObserver, data.secondary);
        } else {
          console.error('Secondary Data response received with no secondary observer available', data.secondary);
        }
      }
    };
    // this.workerInstance.onmessageerror = (err) => observer.error(err);
  }

  private cleanup() {
    this.isStarted = false;
    this.isTerminated = true;
    this.workerInstance.terminate();
    this.workerInstance = null;
  }

  public start(payload: TPayload) : Observable<WorkerResponse<TResult>> {
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
      this.primaryObserver = observer;
      this.setup();
      this.isStarted = true;
      this.workerInstance.postMessage({ primary: payload });
      return () => this.cleanup();
    });
  }

  public sendNewMessage(payload: TPayload) : void {
    if (isNotNil(this.workerInstance) && this.isStarted) {
      this.workerInstance.postMessage({ primary: payload });
    }
  }

  public sendAlternateMessage(payload: UPayload) : Observable<WorkerResponse<UResult>> {
    if (isNotNil(this.workerInstance) && this.isStarted) {
      return new Observable(observer => {
        this.secondaryObserver = observer;
        this.workerInstance.postMessage({ secondary: payload });
        return () => {
          this.secondaryObserver = null;
        };
      });
    }
  }
}
