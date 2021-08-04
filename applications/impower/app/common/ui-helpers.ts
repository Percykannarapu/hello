interface BaseGridColumn {
  header: string;
  width: string;
  filterType: string;
  tooltip?: string;
  digitsInfo?: string;
}

export interface SimpleGridColumn extends BaseGridColumn{
  field: string;
}

export interface GridColumn<T = any> extends BaseGridColumn {
  field: keyof T;
}
