import { Component, Input } from '@angular/core';

@Component({
  selector: 'val-boolean-column-filter',
  templateUrl: './boolean-column-filter.component.html'
})
export class BooleanColumnFilterComponent {

  @Input()
  field: string;

  @Input()
  trueValue: any = true;

  @Input()
  falseValue: any = false;

  @Input()
  constraint: string = 'contains';

  constructor() { }
}
