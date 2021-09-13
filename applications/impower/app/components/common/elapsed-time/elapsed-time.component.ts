import { Component, Input, OnChanges, SimpleChanges } from '@angular/core';
import * as moment from 'moment';

@Component({
  selector: 'val-elapsed-time',
  template: '<div [class]="className" [title]="toolTip">{{display}}</div>'
})
export class ElapsedTimeComponent implements OnChanges {

  display: string;
  toolTip: string;

  @Input() start: Date;
  @Input() end: Date;
  @Input() className: string;

  constructor() { }

  public ngOnChanges(changes: SimpleChanges) : void {
    this.end = this.end ?? this.start;
    const duration = moment.duration(moment(this.end).diff(moment(this.start)));
    this.toolTip = `hours: ${duration.get('hours')} minutes: ${duration.get('minutes')} seconds: ${duration.get('seconds')}`;
    this.display = `${duration.asMinutes().toFixed()} minutes`;
  }

}
