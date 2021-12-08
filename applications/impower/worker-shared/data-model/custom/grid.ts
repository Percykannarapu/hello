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

export interface GeoGridResponse {
  additionalAudienceColumns: TypedGridColumn<GeoGridRow>[];
  rows: GeoGridRow[];
  stats: GeoGridStats;
  metadata: GeoGridMetaData;
  multiSelectOptions: Record<string, string[]>;
}
