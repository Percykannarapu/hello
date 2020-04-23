import { Component, Input, OnDestroy, OnInit, ViewEncapsulation } from '@angular/core';
import { BoundaryConfiguration, EsriBoundaryService } from '@val/esri';
import { Subject } from 'rxjs';
import { AppLoggingService } from '../../../services/app-logging.service';

@Component({
  selector: 'val-boundary-list',
  templateUrl: './boundary-list.component.html',
  styleUrls: ['./boundary-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BoundaryListComponent implements OnInit, OnDestroy {

  @Input() boundaryConfigurations: BoundaryConfiguration[];

  currentOpenId: string;

  private destroyed$ = new Subject<void>();

  constructor(private esriBoundaryService: EsriBoundaryService,
              private logger: AppLoggingService) { }

  ngOnInit() : void {

  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  toggleVisibility(event: MouseEvent, boundary: BoundaryConfiguration) : void {
    if (boundary.id == null) return;
    const copy = { ...boundary, visible: !boundary.visible };
    this.esriBoundaryService.updateBoundaryConfig(copy);
    if (event != null) event.stopPropagation();
  }

  openConfiguration(boundary: BoundaryConfiguration) {
    this.currentOpenId = boundary.id;
  }

  applyConfiguration(config: BoundaryConfiguration) : void {
    const newBoundary: BoundaryConfiguration = { ...config };
    this.logger.debug.log('Applying Configuration changes. New values:', { ...newBoundary });
    this.esriBoundaryService.updateBoundaryConfig(newBoundary);
  }
}
