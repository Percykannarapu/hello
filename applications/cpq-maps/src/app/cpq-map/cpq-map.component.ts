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

  sideNavVisible = false;
  gridSize = 'small';

  get gridIsSmall() { return this.gridSize === 'small'; }
  get gridIsLarge() { return this.gridSize === 'large'; }
  get gridIsVisible() { return this.gridSize !== 'none'; }

  constructor(private store$: Store<FullState>) { }

  ngOnInit() {

  }

  ngOnDestroy() : void {
    this.componentDestroyed.next();
  }
}
