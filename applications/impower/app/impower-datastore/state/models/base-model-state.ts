import { DAOBaseStatus } from '../../../val-modules/api/models/BaseModel';

export const parseStatus: (payloadStatus: string) => DAOBaseStatus = (payloadStatus: string) => {
  const result: DAOBaseStatus | undefined = DAOBaseStatus[payloadStatus];
  if (result === undefined) throw new Error(`Unknown DAOBaseStatus: ${payloadStatus}`);
  return result;
};

export class BaseModelState {
  public dirty: Boolean;
  public baseStatus: DAOBaseStatus;

  constructor() {
    this.dirty = false;
    this.baseStatus = DAOBaseStatus.INSERT;
  }
}
