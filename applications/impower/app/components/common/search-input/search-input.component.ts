import { Component, EventEmitter, Input, OnDestroy, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { getUuid, isNotNil } from '@val/common';
import { BehaviorSubject, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map, takeUntil } from 'rxjs/operators';

@Component({
  selector: 'val-search-input',
  templateUrl: './search-input.component.html',
  styleUrls: ['./search-input.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class SearchInputComponent implements OnInit, OnDestroy {

  @Input()
  public label = 'Search';
  @Output()
  public resultChanged = new EventEmitter<string>();

  public controlId = getUuid();
  public searchText$ = new BehaviorSubject<string | null>(null);
  private destroyed$ = new Subject<void>();

  public constructor() { }

  ngOnInit() : void {
    this.searchText$.pipe(
      takeUntil(this.destroyed$),
      debounceTime(250),
      filter(isNotNil),
      map(term => term.trim()),
      distinctUntilChanged(),
    ).subscribe(searchValue => this.resultChanged.emit(searchValue));
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  reset() : void {
    this.searchText$.next('');
  }

  getValue() : string {
    return this.searchText$.getValue();
  }
}
