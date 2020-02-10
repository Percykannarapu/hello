import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { getUuid } from '@val/common';
import { ConfigurationTypes } from '@val/esri';
import { MenuItem, SelectItem } from 'primeng/api';
import { Observable } from 'rxjs';
import { Audience } from '../../../impower-datastore/state/transient/audience/audience.model';
import { GfpShaderKeys } from '../../../models/ui-enums';
import { AppLocationService } from '../../../services/app-location.service';
import { UIShadingDefinition } from '../shading-ui-helpers';

@Component({
  selector: 'val-shading-list',
  templateUrl: './shading-list.component.html',
  styleUrls: ['./shading-list.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class ShadingListComponent implements OnInit {

  private _audiences: Audience[];
  private _locationCount: number;
  private _tradeAreaCount: number;

  @Input() currentAnalysisLevel: string;
  @Input() shadingDefinitions: UIShadingDefinition[];
  @Output() addShader: EventEmitter<Partial<UIShadingDefinition>> = new EventEmitter<Partial<UIShadingDefinition>>();
  @Output() editShader: EventEmitter<Partial<UIShadingDefinition>> = new EventEmitter<Partial<UIShadingDefinition>>();
  @Output() deleteShader: EventEmitter<string> = new EventEmitter<string>();
  @Output() applyShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();
  @Output() touchShader: EventEmitter<UIShadingDefinition> = new EventEmitter<UIShadingDefinition>();

  buttonOptions: MenuItem[];
  shadingTypes = GfpShaderKeys;
  siteLabels$: Observable<SelectItem[]>;

  get audiences() : Audience[] {
    return this._audiences;
  }
  @Input()
  set audiences(value: Audience[]) {
    this._audiences = value;
    this.setupButtonMenu();
  }

  get tradeAreaCount() : number {
    return this._tradeAreaCount;
  }
  @Input()
  set tradeAreaCount(value: number) {
    this._tradeAreaCount = value;
    this.setupButtonMenu();
  }

  get locationCount() : number {
    return this._locationCount;
  }
  @Input()
  set locationCount(value: number) {
    this._locationCount = value;
    this.setupButtonMenu();
  }

  constructor(private locationService: AppLocationService) { }

  ngOnInit() : void {
    this.setupButtonMenu();
    this.siteLabels$ = this.locationService.siteLabelOptions$;
  }

  private setupButtonMenu() : void {
    const options = [
      { label: 'Add Selection Shading', command: () => this.add(GfpShaderKeys.Selection, this.getSelectionLayerName()) },
    ];
    if (this._locationCount != null && this._locationCount > 0) {
      options.push({ label: 'Add Owner Site Shading', command: () => this.add(GfpShaderKeys.OwnerSite, 'Owner Site') });
    }
    if (this._tradeAreaCount != null && this._tradeAreaCount > 0) {
      options.push({ label: 'Add Owner TA Shading', command: () => this.add(GfpShaderKeys.OwnerTA, 'Owner Trade Area') });
    }
    if (this._audiences != null && this._audiences.length > 0) {
      options.push({ label: 'Add Variable Shading', command: () => this.add('') });
    }
    this.buttonOptions = options;
  }

  private getSelectionLayerName() : string {
    const analysisName = this.currentAnalysisLevel || 'Geo';
    return `Selected ${analysisName}s`;
  }

  add(dataKey: string, layerName?: string) : void {
    const sortOrder = Math.max(...this.shadingDefinitions.map(s => s.sortOrder), this.shadingDefinitions.length) + 1;
    const newForm: Partial<UIShadingDefinition> = {
      id: getUuid(),
      dataKey,
      sortOrder,
      isNew: true,
      visible: true,
      layerName,
      opacity: 0.5,
      filterField: 'geocode',
      usableAnalysisLevel: this.currentAnalysisLevel,
      showLegendHeader: false,
      isOpenInUI: true
    };
    switch (dataKey) {
      case GfpShaderKeys.Selection:
        newForm.shadingType = ConfigurationTypes.Simple;
        newForm.opacity = 0.25;
        newForm.filterByFeaturesOfInterest = true;
        break;
      case GfpShaderKeys.OwnerSite:
        (newForm as any).secondaryDataKey = 'locationNumber';
      // tslint:disable-next-line:no-switch-case-fall-through
      case GfpShaderKeys.OwnerTA:
        newForm.shadingType = ConfigurationTypes.Unique;
        newForm.legendHeader = layerName;
        newForm.showLegendHeader = true;
        newForm.filterByFeaturesOfInterest = true;
        break;
      default:
        newForm.filterByFeaturesOfInterest = false;
    }
    this.addShader.emit(newForm);
  }

  delete(event: MouseEvent, definition: UIShadingDefinition) : void {
    if (!definition.isEditing) {
      this.deleteShader.emit(definition.id);
    }
    event.stopPropagation();
  }

  toggleVisibility(event: MouseEvent, definition: UIShadingDefinition) : void {
    if (!definition.isEditing) {
      const newDef = { ...definition, usableAnalysisLevel: this.currentAnalysisLevel };
      newDef.visible = !definition.visible;
      this.touchShader.emit(newDef);
    }
    event.stopPropagation();
  }
}
