import { Pipe, PipeTransform } from '@angular/core';
import { strToBool } from '@val/common';
import { BooleanDisplayTypes } from '../../../../worker-shared/data-model/custom/grid';

@Pipe({
  name: 'anyToBool'
})
export class AnyToBoolPipe implements PipeTransform {

  transform(value: any) : boolean | null {
    return value == null ? null : strToBool(`${value}`);
  }
}

@Pipe({
  name: 'boolToString'
})
export class BoolToStringPipe implements PipeTransform {

  transform(value: boolean, format: BooleanDisplayTypes) : string {
    switch (format) {
      case BooleanDisplayTypes.TrueFalse:
        return value ? 'True' : 'False';
      case BooleanDisplayTypes.TF:
        return value ? 'T' : 'F';
      case BooleanDisplayTypes.YN:
        return value ? 'Y' : 'N';
      case BooleanDisplayTypes.OneZero:
        return value ? '1' : '0';
    }
  }
}
