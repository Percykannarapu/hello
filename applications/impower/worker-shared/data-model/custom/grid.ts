export enum BooleanDisplayTypes {
  TrueFalse,
  TF,
  YN,
  OneZero,
  Checkbox
}

export enum SubTotalTypes {
  None,
  Total,
  AverageOnly,
  AllocatedTotal,
  AllocatedAverageOnly
}

interface BaseGridColumn {
  header: string;
  width: string;
  searchable?: boolean;
  filterType?: string;
  sortType?: string;
  tooltip?: string;
  digitsInfo?: string;
  boolInfo?: BooleanDisplayTypes;
  isCurrency?: boolean;
  unsorted?: boolean;
  isStatic?: boolean;
  isPlaceHolder?: boolean;
  subTotalType?: SubTotalTypes;
  isDynamic?: boolean;
}

export interface SimpleGridColumn extends BaseGridColumn {
  field: string;
}

export interface TypedGridColumn<T> extends BaseGridColumn {
  field: (keyof T) | string;
}

export interface LocationGridColumn<T> extends TypedGridColumn<T> {
  allowAsSymbolAttribute?: boolean;
  isActive: boolean;
}

export interface ActiveTypedGridColumn<T> extends TypedGridColumn<T> {
  isActive: boolean;
}

export interface GeoGridColumnsStats {
  Total?: number;
  Average: number;
  Min: number;
  Max: number;
  digitsInfo: string;
  Count: number;
  ['Non-null Count']: number;
}

export interface GeoGridMetaData {
  allFilteredGeocodes: string[];
  allHomeGeocodes: string[];
  allMustCoverGeocodes: string[];
}

export interface GeoGridStats {
  locationCount: number;
  activeLocationCount: number;
  geoCount: number;
  currentGeoCount: number;
  activeGeoCount: number;
  currentActiveGeoCount: number;
  columnStats: Record<string, GeoGridColumnsStats>;
}

export interface GeoGridRow {
  ggId: number;
  siteCount: number;
  isActive: boolean;
  locationNumber: string;
  locationName: string;
  locationMarket: string;
  locationAddress: string;
  locationCity: string;
  locationState: string;
  locationZip: string;
  isHomeGeo: boolean;
  isMustCover: boolean;
  distance: number;
  geocode: string;
  geocodeTooltip: string;
  geoName: string;
  hhc: number;
  hhcAllocated: number;
  cpm: number;
  investment: number;
  investmentAllocated: number;
  ownerGroup: string;
  coverageDescription: string;
  isPOB: boolean;
  dma: string;
  isInDeduped: boolean;
  ownerSite: string;
  audienceData: Record<number, any>;
}

export interface LocationGridStats {
  locationCount: number;
  activeLocationCount: number;
  columnStats: Record<string, GeoGridColumnsStats>;
}


export interface GeoGridResponse {
  additionalAudienceColumns: ActiveTypedGridColumn<GeoGridRow>[];
  rows: GeoGridRow[];
  stats: GeoGridStats;
  metadata: GeoGridMetaData;
  multiSelectOptions: Record<string, string[]>;
}

export interface LocationGridRow {
     glId: number;
     isActive: boolean;
     locationNumber: string;
     locationName: string;
     locAddress: string;
     locCity: string;
     locState: string;
     locZip: string;
     marketName: string;
     marketCode: string;
     totalHHC: number;
     totalAllocatedHHC: number;
     description: string;
     groupName: string;
     radius1: number;
     radius2: number;
     radius3: number;
     ycoord: number;
     xcoord: number;
     recordStatusCode: string;
     homeGeocodeIssue: string;
     homeZip: string;
     homeAtz: string;
     homeDigitalAtz: string;
     homePcr: string;
     homeDmaCode: string;
     homeDmaName: string;
     homeCounty: string;
     geocoderMatchCode: string;
     geocoderLocationCode: string;
     origAddress1: string;
     origCity: string;
     origState: string;
     origPostalCode: string;
}

export interface LocGridMetaData {
  allFilteredSites: string[];
  allFilteredGeos: string[];
}

export interface LocationGridResponse {
  rows: LocationGridRow[];
  stats: LocationGridStats;
  metadata: LocGridMetaData;
  multiSelectOptions: Record<string, string[]>;
}
