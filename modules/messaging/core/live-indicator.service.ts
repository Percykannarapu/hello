import { Injectable } from '@angular/core';
import { BehaviorSubject, merge, Observable, Subscription } from 'rxjs';

@Injectable()
export class LiveIndicatorService {

  private sources = new Map<string, Observable<string>>();
  private subscription: Subscription;
  public source$ = new BehaviorSubject<string>(null);
  public hasSource$ = new BehaviorSubject(false);

  constructor() { }

  addSource(key: string, source: Observable<string>) {
    this.sources.set(key, source);
    this.setupSources();
  }

  removeSource(key: string) {
    if (this.sources.has(key)) {
      this.sources.delete(key);
      this.setupSources();
    }
  }

  private setupSources() : void {
    if (this.subscription) this.subscription.unsubscribe();
    if (this.sources.size > 0) {
      this.subscription = merge(...Array.from(this.sources.values())).subscribe(this.source$);
      this.hasSource$.next(true);
    } else {
      this.hasSource$.next(false);
    }
  }
}
