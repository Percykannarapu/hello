import { CurrencyPipe, DecimalPipe } from '@angular/common';
import { Pipe, PipeTransform } from '@angular/core';
import { isNil, isNotNil } from '@val/common';

interface StatData {
  digitsInfo: string;
  [key: string] : any;
}

@Pipe({
  name: 'statTableTooltip'
})
export class StatTableTooltipPipe implements PipeTransform {

  constructor(private decimalPipe: DecimalPipe, private currencyPipe: CurrencyPipe) {
  }

  transform(value: StatData) : string {
    // filter out keys that start with a lower case
    const keys = Object.keys(value).filter(k => k[0].toLowerCase() !== k[0]);
    const decimalFormat = value.digitsInfo;
    if (keys.length > 0) {
      let result = '<table>';
      keys.forEach(k => {
        if (isNotNil(value[k])) {
          if (k.toLowerCase().includes('count')) {
            result += `<tr><td style='text-align:right;'>${k}:</td><td>${this.decimalPipe.transform(value[k], '1.0-0')}</td></tr>`;
          } else if (isNil(decimalFormat)) {
            result += `<tr><td style='text-align:right;'>${k}:</td><td>${this.currencyPipe.transform(value[k])}</td></tr>`;
          } else {
            result += `<tr><td style='text-align:right;'>${k}:</td><td>${this.decimalPipe.transform(value[k], decimalFormat)}</td></tr>`;
          }
        }
      });
      result += '</table>';
      return result;
    } else {
      return null;
    }
  }

}
