import { WorkerResponse } from '../common/core-interfaces';

export interface TreeviewState<TPayload, TResponse> {
  getNodes(payload: TPayload) : Promise<WorkerResponse<TResponse>>;
}
