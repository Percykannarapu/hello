import { CommonSort } from '@val/common';

export class EsriSort {

  // Print Task Proxy Sorters
  public static classBreakByMaxValue(a: { classMaxValue: number }, b: { classMaxValue: number }){
    return CommonSort.GenericNumber(a.classMaxValue, b.classMaxValue);
  }

}
