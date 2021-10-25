import { exportGeoFootprint } from '../worker-shared/export-workers/geofootprint-export.state';
import { GeoFootprintExportWorkerPayload } from '../worker-shared/export-workers/payloads';

interface Payload { data: GeoFootprintExportWorkerPayload; }

addEventListener('message', (payload: Payload) => {
  const response = exportGeoFootprint(payload.data);
  postMessage(response);
});
