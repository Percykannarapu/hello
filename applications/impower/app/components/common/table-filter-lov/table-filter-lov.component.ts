import { Component, OnInit, Input, Output, EventEmitter, ViewChild } from '@angular/core';
import { mapArray, distinctArray } from '@val/common';
import { Observable, BehaviorSubject } from 'rxjs';
import { MultiSelect } from 'primeng/multiselect';
import { SelectItem } from 'primeng/api';
import { map } from 'rxjs/operators';

@Component({
  selector: 'val-table-filter-lov',
  templateUrl: './table-filter-lov.component.html',
  styleUrls:  ['./table-filter-lov.component.css']
})
export class TableFilterLovComponent implements OnInit {
  @Input() field: string;
  @Input() defaultLabel: string = 'All';
  @Input('source')
  set source(val: any[]) {
    this.valuesBS$.next(val);
  }

  @Output() filterApplied = new EventEmitter<string[]>();
  @Output() filterCleared = new EventEmitter<string>();
  @Output() onShow = new EventEmitter<string>();
  @Output() onHide = new EventEmitter<string>();

  // Behavior subject for source input values
  private valuesBS$ = new BehaviorSubject<any[]>([]);

  // Observables for unique values for the multi select
  public  uniqueValues$: Observable<SelectItem[]>;

  @ViewChild(MultiSelect, { static: true }) private multiSelect: MultiSelect;

  // -------------------------------------------------------------------------
  // Lifecycle Methods
  // -------------------------------------------------------------------------
  constructor() { }

  ngOnInit() {
    // Create unique list of field values from the source data
    this.uniqueValues$ = this.valuesBS$.pipe(mapArray(val => val[this.field]),
                                             distinctArray(),
                                             map(arr => arr.sort()),
                                             mapArray(val => new Object({ label: val, value: val}) as SelectItem));
  }

  // -------------------------------------------------------------------------
  // Utility Methods
  // -------------------------------------------------------------------------
  public clearFilter() {
    // Clear the multiSelect component
    this.multiSelect.value = null;
    this.multiSelect.valuesAsString = this.defaultLabel;

    // Trigger a grid change without filters
    this.onChangeEvent(null);

    // Emit a field cleared event
    this.filterCleared.emit(this.field);
  }

  // -------------------------------------------------------------------------
  // Event Handler Methods
  // -------------------------------------------------------------------------
  onChangeEvent(event: string[]) {
    this.filterApplied.emit(event);
  }

  onShowEvent() {
    this.onShow.emit(this.field);
  }

  onHideEvent() {
    this.onHide.emit(this.field);
  }
}
