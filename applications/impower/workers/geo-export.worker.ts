/// <reference lib="webworker" />

import { exportGeoFootprint } from '../worker-shared/geofootprint-export.state';
import { GeoFootprintExportWorkerPayload } from '../worker-shared/payload-interfaces';

interface Payload { data: GeoFootprintExportWorkerPayload; }

addEventListener('message', (payload: Payload) => {
  const response = exportGeoFootprint(payload.data);
  postMessage(response);
});
