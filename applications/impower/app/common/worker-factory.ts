import { getUuid } from '@val/common';
import { DualObservableWorker, ObservableWorker } from '../../worker-shared/common/core-interfaces';
import { DualObservableWebWorker } from '../../worker-shared/common/dual-observable-worker.impl';
import { ObservableWebWorker } from '../../worker-shared/common/observable-worker.impl';
import { ObservableWorkerFallback } from '../../worker-shared/common/worker-fallback.impl';
import { GeoGridResponse, LocationGridResponse } from '../../worker-shared/data-model/custom/grid';
import { exportGeoFootprint } from '../../worker-shared/export-workers/geofootprint-export.state';
import { exportLocations } from '../../worker-shared/export-workers/location-export.state';
import { GeoFootprintExportWorkerPayload, LocationExportWorkerPayload } from '../../worker-shared/export-workers/payloads';
import { requestGridRows } from '../../worker-shared/grid-workers/geo-grid.state';
import { GeoGridExportRequest, GeoGridPayload, HgcIssuesLogExportRequest, LocationGridPayload } from '../../worker-shared/grid-workers/payloads';
import { requestTreeNodes } from '../../worker-shared/treeview-workers/offline-treeview.state';
import {
  requestInMarketTreeNodes,
  requestInterestTreeNodes,
  requestPixelTreeNodes,
  requestVlhTreeNodes
} from '../../worker-shared/treeview-workers/online-treeview.state';
import { TreeviewPayload, TreeViewResponse } from '../../worker-shared/treeview-workers/payloads';

export class WorkerFactory {

  private static browserCheck() : boolean {
    return typeof Worker !== 'undefined';
  }

  public static createLocationExportWorker() : ObservableWorker<LocationExportWorkerPayload, string | string[]> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/location-export.worker', {type: 'module', name: 'location-export-worker'});
      return new ObservableWebWorker<LocationExportWorkerPayload, string | string[]>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(exportLocations, false, workerId);
    }
  }

  public static createGeoExportWorker() : ObservableWorker<GeoFootprintExportWorkerPayload, string> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/geo-export.worker', {type: 'module', name: 'geo-export-worker'});
      return new ObservableWebWorker<GeoFootprintExportWorkerPayload, string>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(exportGeoFootprint, false, workerId);
    }
  }

  public static createOfflineTreeviewWorker() : ObservableWorker<TreeviewPayload, TreeViewResponse> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/offline-treeview.worker', {type: 'module', name: 'offline-cache'});
      return new ObservableWebWorker<TreeviewPayload, TreeViewResponse>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(requestTreeNodes, true, workerId);
    }
  }

  public static createInterestTreeviewWorker() : ObservableWorker<TreeviewPayload, TreeViewResponse> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/interest-treeview.worker', {type: 'module', name: 'interest-cache'});
      return new ObservableWebWorker<TreeviewPayload, TreeViewResponse>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(requestInterestTreeNodes, true, workerId);
    }
  }

  public static createInMarketTreeviewWorker() : ObservableWorker<TreeviewPayload, TreeViewResponse> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/inmarket-treeview.worker', {type: 'module', name: 'inmarket-cache'});
      return new ObservableWebWorker<TreeviewPayload, TreeViewResponse>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(requestInMarketTreeNodes, true, workerId);
    }
  }

  public static createVlhTreeviewWorker() : ObservableWorker<TreeviewPayload, TreeViewResponse> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/vlh-treeview.worker', {type: 'module', name: 'vlh-cache'});
      return new ObservableWebWorker<TreeviewPayload, TreeViewResponse>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(requestVlhTreeNodes, true, workerId);
    }
  }

  public static createPixelTreeviewWorker() : ObservableWorker<TreeviewPayload, TreeViewResponse> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/pixel-treeview.worker', {type: 'module', name: 'pixel-cache'});
      return new ObservableWebWorker<TreeviewPayload, TreeViewResponse>(workerInstance, workerId);
    } else {
      return new ObservableWorkerFallback(requestPixelTreeNodes, true, workerId);
    }
  }

  public static createGeoGridWorker() : DualObservableWorker<GeoGridPayload, GeoGridResponse, GeoGridExportRequest, string> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/geo-grid.worker', {type: 'module', name: 'geo-grid'});
      return new DualObservableWebWorker<GeoGridPayload, GeoGridResponse, GeoGridExportRequest, string>(workerInstance, workerId);
    } else {
      return null;
      //return new ObservableWorkerFallback(requestGridRows, false, workerId);
    }
  }


  public static createLocationGridWorker() : DualObservableWorker<LocationGridPayload, LocationGridResponse, HgcIssuesLogExportRequest, string> {
    const workerId = getUuid();
    if (this.browserCheck()) {
      const workerInstance = new Worker('workers/geo-grid.worker', {type: 'module', name: 'geo-grid'});
      return new DualObservableWebWorker<LocationGridPayload, LocationGridResponse, HgcIssuesLogExportRequest, string>(workerInstance, workerId);
    } else {
      return null;
      //return new ObservableWorkerFallback(requestGridRows, false, workerId);
    }
  }
}
