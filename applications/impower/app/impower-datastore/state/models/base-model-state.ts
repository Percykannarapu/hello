import { BaseModelPayload } from '../../payload-models/base-model-payload';
import { DAOBaseStatus } from './impower-model.enums';

export class BaseModelState {
  public dirty: boolean = false;
  public baseStatus: DAOBaseStatus = DAOBaseStatus.INSERT;

  constructor(data?: Partial<BaseModelPayload>) {
    if (data != null) {
      const baseStatus = { baseStatus: DAOBaseStatus.parse(data.baseStatus) };
      Object.assign(this, data, baseStatus);
    }
  }
}
