/**
 * Allows decorating properties with @transient to be omitted from JSON.stringify
 * as well as other enumerable things such as for...in loop and Object.keys().
 * @param target The object to hide the property from serialization for.
 * @param key The property name to make transient.
 * @summary transient fields are read-only and are not persisted with the model.
 */
import { DAOBaseStatus } from '../../../../worker-shared/data-model/impower.data-model.enums';

export function transient(target: any, key: string) : void {
   if (target.transients == null) target.transients = [];
   target.transients.push(key);
}

export class BaseModel
{
   // ----------------------------------------------------------------------------
   // OBJECT STATUSES USED BY THE DAO
   // ----------------------------------------------------------------------------
   public dirty: Boolean;
   public baseStatus: DAOBaseStatus;

   constructor() {
      this.dirty = true;
      this.baseStatus = DAOBaseStatus.UNCHANGED;
      const transients = (this as any).transients || [];
      transients.forEach((t: string) => {
         Object.defineProperty(this, t, {
           enumerable: false,
           configurable: true,
           writable: true
         });
      });
   }
}
