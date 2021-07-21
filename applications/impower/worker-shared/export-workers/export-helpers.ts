import { encloseInQuotes, isEmpty, isFunction, isNil, isNumber, isString } from '@val/common';
import { WorkerResponse, WorkerStatus } from '../common/core-interfaces';
import { WorkerProcessReturnType } from './payloads';

type variableHandlerType<TEntity, TState> = (state: TState, data: TEntity, header: string) => any;

export interface ColumnDefinition<TEntity, TState = any> {
  header: string;
  row: number | string | variableHandlerType<TEntity, TState>;
}

export interface ExportState<TEntity> {
  getColumns() : ColumnDefinition<TEntity, ExportState<TEntity>>[];
  getRows() : TEntity[];
}

export function prepareData<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType.BlobUrl, completeOnFinalOutput: boolean) : WorkerResponse<string>;
export function prepareData<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType.OutputData, completeOnFinalOutput: boolean) : WorkerResponse<string[]>;
export function prepareData<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType, completeOnFinalOutput: boolean) : WorkerResponse<string | string[]>;
export function prepareData<TEntity>(stateInstance: ExportState<TEntity>, returnType: WorkerProcessReturnType, completeOnFinalOutput: boolean) : WorkerResponse<string | string[]> {
  const result: WorkerResponse<string | string[]> = {
    status: WorkerStatus.Running,
    message: '',
    rowsProcessed: 0,
    value: [],
  };
  try {
    const outputData = createCsvData(stateInstance);
    // having data flow through an extra variable is to keep the result object clean until after
    // all possible exception-generating events have taken place
    let finalOutput: string | string[];
    if (returnType === WorkerProcessReturnType.BlobUrl) {
      const dataString: string = outputData.join('\n');
      const blob = new Blob(['\ufeff', dataString]);
      finalOutput = URL.createObjectURL(blob);
    } else {
      finalOutput = outputData;
    }

    result.rowsProcessed = outputData.length - 1; // -1 for the header
    result.value = finalOutput;
    if (completeOnFinalOutput) result.status = WorkerStatus.Complete;
    return result;

  } catch (err) {
    console.groupCollapsed('%cAdditional Worker Error Info', 'color: red');
    console.error(err);
    console.groupEnd();
    result.status = WorkerStatus.Error;
    result.message = err?.message ?? 'There was an unspecified error processing the export data. See F12 console for more details.';
    return result;
  }
}

function createCsvData<TEntity>(stateInstance: ExportState<TEntity>) : string[] {
  const csvSource: TEntity[] = stateInstance.getRows();
  const columns = stateInstance.getColumns();

  if (isEmpty(csvSource)) {
    throw new Error('There was no source data to process');
  }

  if (isEmpty(columns)) {
    throw new Error('There were are no columns defined for the given format');
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
      const currentValue = isFunction(column.row) ? column.row(stateInstance, data, column.header) : column.row;
      if (!isNil(currentValue) && isString(currentValue)) {
        currentCell = encloseInQuotes(currentValue);
      } else {
        currentCell = currentValue;
      }
      currentRow.push(currentCell);
    }
    const csvLine = currentRow.join(',');
    if (!isEmpty(csvLine)) csvData.push(csvLine);
  }

  return csvData;
}
