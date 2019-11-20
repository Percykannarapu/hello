type identifierType = string | RegExp | ((header: string) => boolean);

export interface ParseRule {
  /**
   * A rule or rules used to identify a specific header in the headerRow
   */
  headerIdentifier: identifierType | identifierType[];
  /**
   * If the header is successfully found, this is the name of the data field the column is output into
   */
  outputFieldName: string;
  mustBeUnique?: boolean;
  required?: boolean;
  dataProcess?: (data: string) => any;
  found?: boolean;
  invalidLength?: boolean;
  uniqueHeader?: boolean;
  width?: number;
}

export interface ParseResponse<T> {
  failedRows: string[];
  parsedData: T[];
  duplicateKeys: string[];
  invalidColLengthHeaders: string[];
  duplicateHeaders: string[];
}

export interface Parser<T> {
  columnParsers: ParseRule[];
  columnDelimiter?: string;
  headerValidator?: (found: ParseRule[]) => boolean;
  dataValidator?: (currentRow: T) => boolean;
  fileValidator?: (allData: T[]) => boolean;
  createNullParser?: (header: string, isUnique: boolean) => ParseRule;
}

export class FileService {

  constructor() {}

  /**
   * Parses a delimited file into an array of data structures
   * @param {string} headerRow - the delimited row representing the header
   * @param {string[]} dataRows - and array of delimited strings representing the main data of the file
   * @param {Parser<T>} parser - an object encapsulating the rules used to identify which columns go to which output fields, and any manipulations used on those fields
   * @param {string[]} existingUniqueValues - an array of existing unique values that will be used when processing the file.
   * @returns {ParseResponse<T>}
   */
  public static parseDelimitedData<T>(headerRow: string, dataRows: string[], parser: Parser<T>, existingUniqueValues: Set<string> = new Set<string>()) : ParseResponse<T> {
    //set up parser defaults
    if (parser.columnDelimiter == null) parser.columnDelimiter = ',';
    if (parser.headerValidator == null) parser.headerValidator = () => true;
    if (parser.dataValidator == null) parser.dataValidator = () => true;
    if (parser.fileValidator == null) parser.fileValidator = () => true;

    const parseEngine = FileService.generateEngine(headerRow, parser); // need a duplicate of the parsers array so we don't add flags to he original source
    if (!parser.headerValidator(parseEngine)) return null;
    const result: ParseResponse<T> = {
      failedRows: [],
      parsedData: [],
      duplicateKeys: [],
      invalidColLengthHeaders: [],
      duplicateHeaders: [],
    };
    parseEngine.forEach(header => {
          if (header.invalidLength)
              result.invalidColLengthHeaders.push(header.outputFieldName);
          if (header.uniqueHeader)
              result.duplicateHeaders.push(header.outputFieldName);

    });
    for (let i = 0; i < dataRows.length; ++i) {
      if (dataRows[i].length === 0) continue; // skip empty rows
      // replace commas embedded inside nested quotes, then remove the quotes.
      const csvRow = dataRows[i].replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '').replace(/"/g, '');
      const columns = csvRow.split(parser.columnDelimiter);
      if (columns.length !== parseEngine.length) {
        result.failedRows.push(dataRows[i]);
      } else {
        const dataResult: T = {} as T;
        let emptyRowCheck = '';
        for (let j = 0; j < columns.length; ++j) {
          const currentColumnValue = parseEngine[j].dataProcess(columns[j].trim());
          dataResult[parseEngine[j].outputFieldName] = currentColumnValue;
          emptyRowCheck += currentColumnValue.toString().trim();
          if (parseEngine[j].mustBeUnique === true) {
            if (existingUniqueValues.has(currentColumnValue)) {
              result.duplicateKeys.push(currentColumnValue);
            }
          }
        }
        if (emptyRowCheck.length === 0) continue; // Don't flag the row as failed if it was empty - just ignore it
        if (parser.dataValidator(dataResult)) {
          result.parsedData.push(dataResult);
        } else {
          result.failedRows.push(dataRows[i]);
        }
      }
    }
    if (!parser.fileValidator(result.parsedData)) { 
      // for ( let i = 0 ; i < dataRows.length; i++) 
      //     result.failedRows.push(dataRows[i]);
      // result.failedRows.push(null);
      return null;
    } 
      return result;
  }

  private static generateEngine<T>(headerRow: string, parser: Parser<T>) : ParseRule[] {
    const delimiter = parser.columnDelimiter;
    const columnParsers = Array.from(parser.columnParsers);
    const regExString = `(".*?"|[^\\s"${delimiter}][^"${delimiter}]+[^\\s"${delimiter}])(?=\\s*${delimiter}|\\s*$)`;
    const regex = new RegExp(regExString, 'gi');
    const headerColumns = headerRow.includes('"') ? headerRow.match(regex) : headerRow.split(delimiter);
    const result: ParseRule[] = [];
    const requiredHeaders: ParseRule[] = columnParsers.filter(p => p.required === true);
    const uniqueHeaders: ParseRule[] = columnParsers.filter(p => p.mustBeUnique === true);
    const uniqueHeaderSet = new Set<string>();
    // reset the column parser for a new file
    columnParsers.forEach(p => {
      p.found = false;
      if (p.dataProcess == null) p.dataProcess = (data => data);
    });
    for (let i = 0; i < headerColumns.length; ++i) {
      let matched = false;
      if (headerColumns[i].startsWith('"') && headerColumns[i].endsWith('"')) headerColumns[i] = headerColumns[i].substring(1, headerColumns[i].length - 1);
      headerColumns[i] = headerColumns[i].trim();
      for (const columnParser of columnParsers) {
        if (!columnParser.found && FileService.matchHeader(headerColumns[i], columnParser)) {
          columnParser.found = true;
          result.push(columnParser);
          matched = true;
          break;
        }
      }
      //if (!matched) result.push(FileService.createNullParser(headerColumns[i]));

      if (!matched) result.push(parser.createNullParser(headerColumns[i], uniqueHeaderSet.has(headerColumns[i])));
      uniqueHeaderSet.add(headerColumns[i]);
    }

    const reqHeaders = requiredHeaders.filter(p => !p.found);
    if (reqHeaders.length > 0) {
      throw new Error(`"${reqHeaders[0].outputFieldName}" is a required column and was not found in the file.`);
    }
    const unHeaders = uniqueHeaders.filter(p => !p.found);
    if (unHeaders.length > 1) {
      throw new Error('The file parsing rule set and file includes multiple unique columns. The current implementation only supports one.');
    }
    return result;
  }

  private static createNullParser(header: string) : ParseRule {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data };
  }

  private static matchHeader(header: string, parser: ParseRule) : boolean {
    const localHeader = header.replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '').replace(/"/g, '');
    const matchString = (identifier: string) => localHeader.toUpperCase() === identifier.toUpperCase();
    const matchRegEx = (identifier: RegExp) => identifier.test(localHeader);
    const matchFunc = (identifier: (string) => boolean) => identifier(localHeader);

    if (typeof parser.headerIdentifier === 'string') {
      return matchString(parser.headerIdentifier);
    }
    if (Array.isArray(parser.headerIdentifier)) {
      let hasMatch: boolean = false;
      for (const identifier of parser.headerIdentifier) {
        if (typeof identifier === 'string') hasMatch = hasMatch || matchString(identifier);
        if (typeof identifier === 'function') hasMatch = hasMatch || matchFunc(identifier);
        if (identifier instanceof RegExp) hasMatch = hasMatch || matchRegEx(identifier);
      }
      return hasMatch;
    }
    if (parser.headerIdentifier instanceof RegExp) {
      return matchRegEx(parser.headerIdentifier);
    }
    if (typeof parser.headerIdentifier === 'function') {
      return matchFunc(parser.headerIdentifier);
    }
    return false;
  }
}
