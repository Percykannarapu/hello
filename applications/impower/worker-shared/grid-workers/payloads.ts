import { ActiveTypedGridColumn, GeoGridRow, TypedGridColumn, LocationGridRow} from '../data-model/custom/grid';
import { WorkerAudience } from '../data-model/custom/worker-audience';
import { ImpGeofootprintGeoPayload } from '../data-model/payloads/imp-geofootprint-geo-payload';
import { ImpGeofootprintLocationPayload } from '../data-model/payloads/imp-geofootprint-location-payload';
import { ImpGeofootprintTradeAreaPayload } from '../data-model/payloads/imp-geofootprint-trade-area-payload';
import { ImpProjectPayload } from '../data-model/payloads/imp-project-payload';

export interface GeoAttribute {
  geocode: string;

  [name: string] : string | number | boolean;
}

export interface GeoVar {
  geocode: string;                   // must have a geocode
  [name: string] : string | number;  // may have additional properties
}

export interface LocationAttribute {
  geocode: string;

  [name: string] : string | number | boolean;
}
export interface FilterInfo {
  value?: any;
  matchMode?: string;
}

export interface WorkerGridEvent {
  first?: number;
  rows?: number;
  sortField?: string;
  sortOrder?: number;
  multiSortMeta?: { field: string; order: number; }[];
  filters?: Record<string, FilterInfo | FilterInfo[]>;
  globalFilter?: any;
}

export interface WorkerGridData {
  project?: Partial<ImpProjectPayload>;
  locations?: ReadonlyArray<ImpGeofootprintLocationPayload>;
  tradeAreas?: ReadonlyArray<ImpGeofootprintTradeAreaPayload>;
  geos?: ImpGeofootprintGeoPayload[];
  gridAudiences?: WorkerAudience[];
  mustCovers?: string[];
  geoAttributes?: Record<string, GeoAttribute>;
  geoVars?: Record<string, GeoVar>;
  primaryColumnDefs?: ActiveTypedGridColumn<GeoGridRow>[];
}

export interface GeoGridPayload {
  gridData?: WorkerGridData;
  gridEvent?: WorkerGridEvent;
}

export interface GeoGridExportRequest {
  activeOnly: boolean;
  respectFilters: boolean;
}

export interface WorkerLocationGridData {
  locations?: ReadonlyArray<ImpGeofootprintLocationPayload>;
  locationAttributes?: Record<string, GeoAttribute>;
  primaryColumnDefs?: ActiveTypedGridColumn<LocationGridRow>[];
}

export interface LocationGridPayload {
  locationGridData?: WorkerLocationGridData;
  locationGridEvent?: WorkerGridEvent;
}

export interface HgcIssuesLogExportRequest {
  activeOnly: boolean;
  respectFilters: boolean;
}