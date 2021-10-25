import { SimpleChange } from '@angular/core';
import { isNotNil } from '@val/common';

export function isValidChange(change: SimpleChange) : boolean {
  return isNotNil(change) && change.previousValue !== change.currentValue;
}
