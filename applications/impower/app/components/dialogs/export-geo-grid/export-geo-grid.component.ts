import { Component, OnInit } from '@angular/core';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';

export enum ExportFormats {
  All,
  Selected,
  AllFiltered,
  SelectedFiltered
}

@Component({
  templateUrl: './export-geo-grid.component.html'
})
export class ExportGeoGridComponent implements OnInit {

  exportFormats = ExportFormats;
  export: ExportFormats;

  geoCount: number;
  currentGeoCount: number;
  activeGeoCount: number;
  currentActiveGeoCount: number;

  constructor(private ddConfig: DynamicDialogConfig,
              private ddRef: DynamicDialogRef) { }

  ngOnInit() {
    this.geoCount = this.ddConfig.data.geoCount;
    this.currentGeoCount = this.ddConfig.data.currentGeoCount;
    this.activeGeoCount = this.ddConfig.data.activeGeoCount;
    this.currentActiveGeoCount = this.ddConfig.data.currentActiveGeoCount;
    const startingValue = [0];
    if (this.geoCount !== this.activeGeoCount) startingValue.push(1);
    if (this.geoCount !== this.currentGeoCount) startingValue.push(2);
    if (this.currentGeoCount !== this.currentActiveGeoCount) startingValue.push(3);
    this.export = Math.max(...startingValue);
    if (startingValue.length === 1) {
      // have to defer this until the next tick, otherwise Angular complains about a component that closes the same tick it's initialized
      setTimeout(() => this.onExport());
    }
  }

  onExport() {
    this.ddRef.close(this.export);
  }
}
