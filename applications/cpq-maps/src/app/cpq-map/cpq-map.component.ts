import { ChangeDetectionStrategy, Component, OnDestroy, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { Subject } from 'rxjs';
import { FullState } from './state';

@Component({
  selector: 'cpq-map',
  templateUrl: './cpq-map.component.html',
  styleUrls: ['./cpq-map.component.css'],
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class CpqMapComponent implements OnInit, OnDestroy {

  private componentDestroyed = new Subject<void>();
  public sideNavVisible = false;
  public panelSize = 'small';

  constructor(private store$: Store<FullState>) { }

  ngOnInit() {

  }

  ngOnDestroy() : void {
    this.componentDestroyed.next();
  }
}
