import Geoprocessor from 'esri/tasks/Geoprocessor';
import PrintTask from 'esri/tasks/PrintTask';
import { from, Observable, ObservableInput, of, throwError } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { EsriUtils } from '../core/esri-utils';

export class ObservableGeoprocessor {

  private readonly _esriInstance: Geoprocessor;

  constructor(properties?: __esri.GeoprocessorProperties) {
    this._esriInstance = new Geoprocessor(properties);
  }

  submitJob(params: any, requestOptions?: any) : Observable<__esri.JobInfo> {
    return from(EsriUtils.esriPromiseToEs6(this._esriInstance.submitJob(params, requestOptions))).pipe(
      switchMap(result => result.jobStatus === 'job-failed' ? throwError(result) : of(result))
    );
  }

  getResultData(jobId: string, resultName: string, requestOptions?: any) : ObservableInput<any> {
    return EsriUtils.esriPromiseToEs6(this._esriInstance.getResultData(jobId, resultName, requestOptions));
  }
}

export class ObservablePrintTask {

  private readonly _esriInstance: PrintTask;

  constructor(properties?: __esri.PrintTaskProperties) {
    this._esriInstance = new PrintTask(properties);
  }

  execute(params: __esri.PrintParameters, requestOptions?: any) : Observable<__esri.PrintResponse> {
    return from(EsriUtils.esriPromiseToEs6(this._esriInstance.execute(params, requestOptions)));
  }

  attachProxyToPromise(methodName: string, proxy: Function) : void {
    const that = this._esriInstance;
    const currentImplementation: Function = this._esriInstance[methodName];
    this._esriInstance[methodName] = function() {
      return currentImplementation.apply(that, arguments).then(proxy);
    };
  }

}
