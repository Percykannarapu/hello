export interface GridColumn<T = any> {
  field: keyof T;
  header: string;
  width: string;
  validatorType: string;
  tooltip?: string;
}
