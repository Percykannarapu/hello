import { isNotNil } from '@val/common';
import { DualPayload, DualResponse } from '../worker-shared/common/core-interfaces';
import { GeoGridResponse } from '../worker-shared/data-model/custom/grid';
import { requestGridExport, requestGridRows } from '../worker-shared/grid-workers/geo-grid.state';
import { GeoGridExportRequest, GeoGridPayload } from '../worker-shared/grid-workers/payloads';

interface Payload { data: DualPayload<GeoGridPayload, GeoGridExportRequest>; }

addEventListener('message', (payload: Payload) => {
  const response: DualResponse<GeoGridResponse, string> = {};
  if (isNotNil(payload.data?.primary)) {
    response.primary = requestGridRows(payload.data.primary);
  }
  if (isNotNil(payload.data?.secondary)) {
    response.secondary = requestGridExport(payload.data.secondary);
  }
  postMessage(response);
});
