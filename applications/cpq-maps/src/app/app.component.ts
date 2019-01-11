import { Component, Input, ElementRef, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { SetGroupId } from './cpq-map/state/shared/shared.actions';
import { LocalState } from './cpq-map/state';

@Component({
  selector: 'cpq-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent implements OnInit {

  constructor(private elementRef: ElementRef, private store: Store<LocalState>) {}

  ngOnInit() {
    const groupId = Number(this.elementRef.nativeElement.getAttribute('groupId'));
    this.store.dispatch(new SetGroupId(groupId));
  }

}
