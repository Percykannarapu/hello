import { isNil, isNotNil, toNullOrNumber } from '@val/common';
import { BooleanDisplayTypes, TypedGridColumn } from '../data-model/custom/grid';
import * as Papa from 'papaparse';

export function prepareRowData<T extends Record<string, any>>(rows: T[], columns: TypedGridColumn<T>[], dynamicSubField: string) : Record<string, string>[] {
  const result: any[] = [{}];
  for (const col of columns) {
    // this generates a header record
    result[0][col.field] = col.header;
  }
  for (const row of rows) {
    const currentData: any = {};
    for (const col of columns) {
      if (col.isDynamic) {
        // audience field
        currentData[col.field] = getFormattedValue(row[dynamicSubField][col.field], col);
      } else {
        // regular field
        currentData[col.field] = getFormattedValue(row[col.field], col);
      }
    }
    result.push(currentData);
  }
  return result;
}

export function createCsvString(rawData: Record<string, string>[], columnOrder: string[], columnsShouldBeQuoted: boolean[]) : string {
  return Papa.unparse(rawData, {
    columns: columnOrder,
    skipEmptyLines: 'greedy',
    header: false,
    quotes: columnsShouldBeQuoted
  });
}

function getFormattedValue<T>(rawValue: any, column: TypedGridColumn<T>) : any {
  if (column.isCurrency) {
    const numericValue = toNullOrNumber(rawValue);
    const fmt = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', useGrouping: false });
    return isNil(numericValue) ? '' : fmt.format(numericValue);
  } else if (isNotNil(column.digitsInfo)) {
    const numericValue = toNullOrNumber(rawValue);
    const minimumIntegerDigits = toNullOrNumber(column.digitsInfo.split('.')[0]) ?? 1;
    const minimumFractionDigits = toNullOrNumber((column.digitsInfo.split('.')[1])?.split('-')[0]) ?? 0;
    const maximumFractionDigits = toNullOrNumber((column.digitsInfo.split('.')[1])?.split('-')[1]) ?? 3;
    const fmt = new Intl.NumberFormat('en-US', { style: 'decimal', useGrouping: false, minimumIntegerDigits, minimumFractionDigits, maximumFractionDigits });
    return isNil(numericValue) ? '' : fmt.format(numericValue);
  } else if (isNotNil(column.boolInfo)) {
    if (isNil(rawValue)) return '';
    switch (column.boolInfo) {
      case BooleanDisplayTypes.TrueFalse:
        return rawValue ? 'True' : 'False';
      case BooleanDisplayTypes.YN:
        return rawValue ? 'Y' : 'N';
      case BooleanDisplayTypes.OneZero:
        return rawValue ? '1' : '0';
      default:
        return rawValue ? 'T' : 'F';
    }
  } else {
    return rawValue ?? '';
  }
}
