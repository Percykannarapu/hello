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
  required?: boolean;
  dataProcess?: (data: string) => any;
  found?: boolean;
}

export interface ParseResponse<T> {
  failedRows: string[];
  parsedData: T[];
}

export class FileService {

  constructor() {}

  /**
   * Parses a delimited file into an array of data structures
   * @param {string} headerRow - the delimited row representing the header
   * @param {string[]} dataRows - and array of delimited strings representing the main data of the file
   * @param {ParseRule[]} parsers - an array of rules used to identify which columns go to which output fields, and any manipulations used on those fields
   * @param {(found: ParseRule[]) => boolean} headerValidator - an optional callback that will be called once when all the headers have been identified by the array of parsers
   * @param {string} delimiter - the delimiter used in the strings passed in for the headerRow and dataRow. Defaults to a comma.
   * @returns {ParseResponse<T>}
   */
  public static parseDelimitedData<T>(headerRow: string, dataRows: string[], parsers: ParseRule[], headerValidator: (found: ParseRule[]) => boolean = null, delimiter: string = ',') : ParseResponse<T> {
    const parseEngine = FileService.generateEngine(headerRow, parsers, delimiter); // need a duplicate of the parsers array so we don't add flags to he original source
    if (headerValidator != null && !headerValidator(parseEngine)) return null;
    const result: ParseResponse<T> = {
      failedRows: [],
      parsedData: []
    };
    for (let i = 0; i < dataRows.length; ++i) {
      if (dataRows[i].length === 0) continue; // skip empty rows
      // replace commas embedded inside nested quotes, then remove the quotes.
      const csvRow = dataRows[i].replace(/,(?!(([^"]*"){2})*[^"]*$)/g, '').replace(/"/g, '');
      const columns = csvRow.split(delimiter);
      if (columns.length !== parseEngine.length) {
        result.failedRows.push(dataRows[i]);
      } else {
        const dataResult: T = {} as T;
        for (let j = 0; j < columns.length; ++j) {
          dataResult[parseEngine[j].outputFieldName] = parseEngine[j].dataProcess(columns[j]);
        }
        result.parsedData.push(dataResult);
      }
    }
    return result;
  }

  private static generateEngine(headerRow: string, parsers: ParseRule[], delimiter: string) : ParseRule[] {
    const headerColumns = headerRow.split(delimiter);
    const result: ParseRule[] = [];
    const requiredHeaders: ParseRule[] = parsers.filter(p => p.required === true);
    // reset the column parser for a new file
    parsers.forEach(p => {
      p.found = false;
      if (p.dataProcess == null) p.dataProcess = (data => data);
    });
    for (let i = 0; i < headerColumns.length; ++i) {
      let matched = false;
      for (const parser of parsers) {
        if (!parser.found && FileService.matchHeader(headerColumns[i], parser)) {
          parser.found = true;
          result.push(parser);
          matched = true;
          break;
        }
      }
      if (!matched) result.push(FileService.createNullParser(headerColumns[i]));
    }

    const reqHeaders = requiredHeaders.filter(p => !p.found);
    if (reqHeaders.length > 0) {
      throw new Error(`"${reqHeaders[0].outputFieldName}" is a required column and was not found in the file.`);
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
