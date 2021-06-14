/// <reference lib="webworker" />

import { exportLocations } from '../worker-shared/location-export.state';
import { LocationExportWorkerPayload } from '../worker-shared/payload-interfaces';

interface Payload { data: LocationExportWorkerPayload; }

addEventListener('message', (payload: Payload) => {
  const response = exportLocations(payload.data);
  postMessage(response);
});
