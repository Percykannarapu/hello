import { Component, Input, OnDestroy, ViewEncapsulation } from '@angular/core';
import { BoundaryConfiguration, duplicateBoundaryConfig, EsriBoundaryService, RgbTuple } from '@val/esri';
import { Subject } from 'rxjs';
import { AppLoggingService } from '../../../services/app-logging.service';
import { BoundaryRenderingService } from '../../../services/boundary-rendering.service';

@Component({
  selector: 'val-boundary-shader-list',
  templateUrl: './boundary-shader-list.component.html',
  styleUrls: ['./boundary-shader-list.component.scss'],
  encapsulation: ViewEncapsulation.None,
})
export class BoundaryShaderListComponent implements OnDestroy {

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
    return this.appBoundaryService.getLayerSetupInfo(boundary.layerKey).defaultFontSize;
  }

  getDefaultColor(boundary: BoundaryConfiguration) {
    return RgbTuple.duplicate(boundary.symbolDefinition.outlineColor);
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
