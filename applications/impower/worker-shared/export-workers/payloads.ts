import { WorkerAudience } from '../data-model/custom/worker-audience';
import { ImpClientLocationTypeCodes } from '../data-model/impower.data-model.enums';
import { ImpGeofootprintGeoPayload } from '../data-model/payloads/imp-geofootprint-geo-payload';
import { ImpGeofootprintLocationPayload } from '../data-model/payloads/imp-geofootprint-location-payload';
import { ImpGeofootprintTradeAreaPayload } from '../data-model/payloads/imp-geofootprint-trade-area-payload';
import { ImpProjectPayload } from '../data-model/payloads/imp-project-payload';

export enum WorkerProcessReturnType {
  BlobUrl,
  OutputData
}

export interface WebWorkerPayload<TEntity> {
  rows: TEntity[];
  outputType: WorkerProcessReturnType;
}

export enum LocationExportFormats {
  alteryx,
  digital,
  homeGeoIssues
}

export enum GeoFootprintExportFormats {
  alteryx,
}

export interface LocationExportWorkerPayload extends WebWorkerPayload<ImpGeofootprintLocationPayload> {
  currentProject: ImpProjectPayload;
  siteType: ImpClientLocationTypeCodes;
  activeOnly: boolean;
  includeAllAttributes: boolean;
  format: LocationExportFormats;
}

export interface GeoFootprintExportWorkerPayload extends WebWorkerPayload<ImpGeofootprintGeoPayload> {
  activeOnly: boolean;
  analysisLevel: string;
  format: GeoFootprintExportFormats;
  locations: ReadonlyArray<ImpGeofootprintLocationPayload>;
  tradeAreas: ReadonlyArray<ImpGeofootprintTradeAreaPayload>;
  mustCovers: string[];
  allAudiences: WorkerAudience[];
  exportedAudiences: WorkerAudience[];
  audienceData: {
    [id: string] : {
      geocode: string;
      [name: string] : string | number;
    }
  };
}
