import { SimpleChange } from '@angular/core';
import { isNotNil } from '@val/common';

interface BaseGridColumn {
  header: string;
  width: string;
  filterType?: string;
  sortType?: string;
  tooltip?: string;
  digitsInfo?: string;
  sortable?: boolean;
}

export interface SimpleGridColumn extends BaseGridColumn{
  field: string;
}

export interface GridColumn<T = any> extends BaseGridColumn {
  field: keyof T;
}

export interface LocationGridColumn extends SimpleGridColumn {
  allowAsSymbolAttribute?: boolean;
}

export function isValidChange(change: SimpleChange) : boolean {
  return isNotNil(change) && change.previousValue !== change.currentValue;
}
