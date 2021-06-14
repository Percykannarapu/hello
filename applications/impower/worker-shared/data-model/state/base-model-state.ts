import { DAOBaseStatus } from '../impower.data-model.enums';
import { BaseModelPayload } from '../payloads/base-model-payload';

export class BaseModelState {
  public dirty: boolean = false;
  public baseStatus: DAOBaseStatus = DAOBaseStatus.INSERT;

  constructor(data?: Partial<BaseModelPayload>) {
    if (data != null) {
      const baseStatus = { baseStatus: DAOBaseStatus.parse(data.baseStatus ?? 'INSERT') };
      Object.assign(this, data, baseStatus);
    }
  }
}
