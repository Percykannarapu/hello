import { ExportState, WorkerProcessReturnType, WorkerResponse, WorkerStatus } from './core-interfaces';

export function isUndefined(value: any) : value is undefined {
  return typeof value === 'undefined';
}

export function isNull(value: any) : value is null {
  return value === null;
}

export function isString(value: any) : value is string {
  return typeof value === 'string';
}

export function isNumber(value: any) : value is number {
  return typeof value === 'number';
}

export function isNil(value: any) : value is (null | undefined) {
  return isNull(value) || isUndefined(value);
}

export function isFunction(value: any) : value is Function {
  return typeof value === 'function';
}

export function isArray(value: any)  : value is any[] {
  return Array.isArray(value);
}

export function isEmpty(value: any) : value is (null | undefined | '' | []) {
  return isNil(value) || (isString(value) && value.trim().length === 0) || (isArray(value) && value.length === 0);
}

export function isValidNumber(value: any) : value is number {
  return isNumber(value) && !isNaN(value); // isNumber will fail on null, isNaN fails on undefined
}

export function isConvertibleToNumber(value: any) : value is number {
  return !isEmpty(value) && isValidNumber(Number(value));
}

export function toNullOrNumber(value: any) : number | null {
  if (!isNil(value) && isConvertibleToNumber(value)) return Number(value);
  return null;
}

function encloseInQuotes(inputValue: any) : any {
  if (!isNil(inputValue) && isString(inputValue)) {
    return (inputValue.slice(0, 1) === '"' ? '' : '"') + inputValue + (inputValue.slice(-1) === '"' ? '' : '"');
  }
  return inputValue;
}

export function prepareOutput<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType.BlobUrl) : WorkerResponse<string>;
export function prepareOutput<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType.OutputData) : WorkerResponse<string[]>;
export function prepareOutput<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType) : WorkerResponse<string | string[]>;
export function prepareOutput<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType) : WorkerResponse<string | string[]> {
  const result: WorkerResponse<string | string[]> = {
    status: WorkerStatus.Running,
    message: '',
    rowsProcessed: 0,
    value: [],
  };
  try {
    const csvSource: TEntity[] = stateInstance.getRows();
    const columns = stateInstance.getColumns();

    if (isEmpty(csvSource)) {
      result.status = WorkerStatus.Error;
      result.message = 'There was no source data to process';
      return result;
    }

    if (isEmpty(columns)) {
      result.status = WorkerStatus.Error;
      result.message = 'There were are no columns defined for the given format';
      return result;
    }

    const csvData: string[] = [];

    // Write Headers
    const headerFields = columns.map(column => {
      if (column.header.includes(',')) return `"${column.header}"`;
      return column.header;
    });
    const headerRow = headerFields.join(',');
    if (!isEmpty(headerRow)) csvData.push(headerRow);

    // Write per-row data
    for (const data of csvSource) {
      const currentRow = [];
      let currentCell;

      // Loop through each column determining its final value
      for (const column of columns) {
        if (isString(column.row) || isNumber(column.row) || isNil(column.row)) {
          currentCell = encloseInQuotes(column.row);
        } else if (isFunction(column.row)) {
          currentCell = encloseInQuotes(column.row(stateInstance, data, column.header));
        } else {
          console.warn('column: ' + column.header + ' = ' + column.row + ' (Unrecognized Type: ' + typeof (column.row) + ')');
          currentCell = column.row;
        }
        currentRow.push(currentCell);
      }
      const csvLine = currentRow.join(',');
      if (!isEmpty(csvLine)) csvData.push(csvLine);
    }

    // having data flow through an extra variable is to keep the result object clean until after
    // all possible exception-generating events have taken place
    let finalOutput: string | string[];
    if (returnType === WorkerProcessReturnType.BlobUrl) {
      const dataString: string = csvData.join('\n');
      const blob = new Blob(['\ufeff', dataString]);
      finalOutput = URL.createObjectURL(blob);
    } else {
      finalOutput = csvData;
    }

    result.rowsProcessed = csvData.length - 1; // -1 for the header
    result.value = finalOutput;
    result.status = WorkerStatus.Complete;
    return result;

  } catch (err) {
    console.groupCollapsed('%cAdditional Worker Error Info', 'color: red');
    console.error(err);
    console.groupEnd();
    result.status = WorkerStatus.Error;
    result.message = 'There was an unspecified error processing the export data. See F12 console for more details.';
    return result;
  }
}
