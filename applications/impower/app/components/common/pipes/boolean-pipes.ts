import { Pipe, PipeTransform } from '@angular/core';
import { strToBool } from '@val/common';

@Pipe({
  name: 'anyToBool'
})
export class AnyToBoolPipe implements PipeTransform {

  transform(value: any) : boolean {
    return value == null ? null : strToBool(`${value}`);
  }

}
