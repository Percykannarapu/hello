import { Pipe, PipeTransform } from '@angular/core';
import { RgbaTuple, RgbTuple } from '@val/esri';

@Pipe({
  name: 'esriRgb2Hex'
})
export class EsriRgb2HexPipe implements PipeTransform {

  transform(value: RgbTuple | RgbaTuple) : string {
    return `rgb(${value.join(',')})`;
  }

}
