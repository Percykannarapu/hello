/// <reference lib="webworker" />

import { exportLocations } from '../worker-shared/export-workers/location-export.state';
import { LocationExportWorkerPayload } from '../worker-shared/export-workers/payloads';

interface Payload { data: LocationExportWorkerPayload; }

addEventListener('message', (payload: Payload) => {
  const response = exportLocations(payload.data);
  postMessage(response);
});
