import { ObservableWorker, WorkerResponse } from '../../worker-shared/core-interfaces';
import { exportGeoFootprint } from '../../worker-shared/geofootprint-export.state';
import { exportLocations } from '../../worker-shared/location-export.state';
import { ObservableWebWorker } from '../../worker-shared/observable-worker.impl';
import { GeoFootprintExportWorkerPayload, LocationExportWorkerPayload } from '../../worker-shared/payload-interfaces';
import { ObservableWorkerFallback } from '../../worker-shared/worker-fallback.impl';

export class WorkerFactory {

  private static browserCheck() : boolean {
    return typeof Worker !== 'undefined';
  }

  public static createLocationExportWorker() : ObservableWorker<LocationExportWorkerPayload, WorkerResponse<string | string[]>> {
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/location-export.worker', {type: 'module'});
      return new ObservableWebWorker<LocationExportWorkerPayload, WorkerResponse<string | string[]>>(workerInstance);
    } else {
      return new ObservableWorkerFallback(exportLocations);
    }
  }

  public static createGeoExportWorker() : ObservableWorker<GeoFootprintExportWorkerPayload, WorkerResponse<string>> {
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/geo-export.worker', {type: 'module'});
      return new ObservableWebWorker<GeoFootprintExportWorkerPayload, WorkerResponse<string>>(workerInstance);
    } else {
      return new ObservableWorkerFallback(exportGeoFootprint);
    }
  }
}
