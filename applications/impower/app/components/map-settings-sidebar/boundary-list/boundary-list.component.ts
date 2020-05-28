import { Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { BoundaryConfiguration, duplicateBoundaryConfig, EsriBoundaryService } from '@val/esri';
import { Subject } from 'rxjs';
import { AppLoggingService } from '../../../services/app-logging.service';
import { BoundaryRenderingService } from '../../../services/boundary-rendering.service';

@Component({
  selector: 'val-boundary-list',
  templateUrl: './boundary-list.component.html',
  styleUrls: ['./boundary-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BoundaryListComponent implements OnDestroy {

  @Input() boundaryConfigurations: BoundaryConfiguration[];

  currentOpenId: string;

  private destroyed$ = new Subject<void>();

  constructor(private esriBoundaryService: EsriBoundaryService,
              private appBoundaryService: BoundaryRenderingService,
              private logger: AppLoggingService) { }

  duplicateConfig(config: BoundaryConfiguration) : BoundaryConfiguration {
    return duplicateBoundaryConfig(config);
  }

  ngOnDestroy() : void {
    this.destroyed$.next();
  }

  getDefaultFontSize(boundary: BoundaryConfiguration) {
    return this.appBoundaryService.getLayerSetupInfo(boundary.dataKey).defaultFontSize;
  }

  toggleVisibility(event: MouseEvent, boundary: BoundaryConfiguration) : void {
    if (boundary.id == null) return;
    this.esriBoundaryService.updateBoundaryConfig({ id: boundary.id, changes: { visible: !boundary.visible }});
    if (event != null) event.stopPropagation();
  }

  openConfiguration(boundary: BoundaryConfiguration) {
    this.currentOpenId = boundary.id;
  }

  applyConfiguration(config: BoundaryConfiguration) : void {
    const newBoundary: BoundaryConfiguration = duplicateBoundaryConfig(config);
    this.logger.debug.log('Applying Configuration changes. New values:', newBoundary);
    this.esriBoundaryService.upsertBoundaryConfig(newBoundary);
  }
}
