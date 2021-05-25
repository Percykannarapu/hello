import { Parser, ParseRule } from '../val-modules/common/services/file.service';

export const customAudienceDataParser: Parser<CustomDataRow> = {
  columnParsers: [
    { headerIdentifier: ['GEO', 'ATZ', 'PCR', 'ZIP', 'DIG', 'ROUTE', 'GEOCODE', 'GEOGRAPHY'], outputFieldName: 'geocode', required: true }
  ],
  createNullParser: (header: string) : ParseRule => {
    return { headerIdentifier: '', outputFieldName: header, dataProcess: data => data };
  }
};

export interface CustomDataRow {
  geocode: string;
  [key: string] : string;
}
