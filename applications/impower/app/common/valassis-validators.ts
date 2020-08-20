import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { isConvertibleToNumber, isValidNumber } from '@val/common';

export class ValassisValidators {

  public static numeric(control: AbstractControl) : ValidationErrors {
    if (control.value == null || isValidNumber(Number(control.value))) {
      return null;
    } else {
      return {
        numeric: true
      };
    }
  }

  public static greaterThan(value: number) : ValidatorFn {
    return (control: AbstractControl) => {
      if (isConvertibleToNumber(control.value) && Number(control.value) <= value) {
        return {
          greaterThan: { greaterThan: value, actual: Number(control.value) }
        };
      } else {
        return null;
      }
    };
  }

  public static lessThan(value: number) : ValidatorFn {
    return (control: AbstractControl) => {
      if (isConvertibleToNumber(control.value) && Number(control.value) >= value) {
        return {
          lessThan: { lessThan: value, actual: Number(control.value) }
        };
      } else {
        return null;
      }
    };
  }
}
