import { Component, Input } from '@angular/core';

@Component({
  selector: 'cpq-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  @Input() mediaPlanGroup: number;
}
