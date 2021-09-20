import { Component, OnInit } from '@angular/core';
import { groupByExtended, roundTo } from '@val/common';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { ManualGeoService } from '../../../services/manual-geo.service';
import { ImpGeofootprintGeo } from '../../../val-modules/targeting/models/ImpGeofootprintGeo';
import { ImpGeofootprintLocation } from '../../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpProject } from '../../../val-modules/targeting/models/ImpProject';

export interface DialogConfigData {
  clickTarget: __esri.Graphic[];
  currentProject: ImpProject;
  currentClientLocations: ImpGeofootprintLocation[];
  currentGeos: ImpGeofootprintGeo[];
  isToggle: boolean;
  isSelect?: boolean;
}

@Component({
  templateUrl: './manual-geo-dialog.component.html',
  styleUrls: ['./manual-geo-dialog.component.scss']
})
export class ManualGeoDialogComponent implements OnInit {

  dataReady: boolean;
  isFilterViolation: boolean;
  hasSomeFilterViolations: boolean;
  isToggle: boolean;
  isSelect: boolean;
  selectableTargetsExist: boolean;
  deSelectableTargetsExist: boolean;
  hasMultipleTargets: boolean;
  locationChoices: SelectItem<ImpGeofootprintLocation>[] = [];
  selectedLocation: ImpGeofootprintLocation;

  private clickTarget: __esri.Graphic[];
  private currentProject: ImpProject;
  private currentClientLocations: ImpGeofootprintLocation[];
  private currentGeos: ImpGeofootprintGeo[];

  constructor(private ddRef: DynamicDialogRef,
              private ddConfig: DynamicDialogConfig,
              private geoService: ManualGeoService) { }

  ngOnInit() : void {
    const data: DialogConfigData = this.ddConfig.data;
    this.dataReady = false;
    this.clickTarget = data.clickTarget;
    this.hasMultipleTargets = groupByExtended(this.clickTarget, g => g.attributes['geocode']).size > 1;
    this.currentProject = data.currentProject;
    this.currentClientLocations = data.currentClientLocations;
    this.currentGeos = data.currentGeos;
    this.isToggle = data.isToggle;
    this.isSelect = data.isSelect ?? false;
    const passesFilter = this.geoService.allAllowedByFilter(this.clickTarget, this.currentProject);
    this.isFilterViolation = passesFilter === false;
    this.hasSomeFilterViolations = passesFilter == null;
    if (this.currentClientLocations.length === 1 && passesFilter) {
      setTimeout(() => this.autoSelect());
    } else {
      setTimeout(() => this.prepareData()); // so the dialog will render with spinner
    }
  }

  existingGeos(isReselect: boolean) : void {
    this.geoService.setExistingGeoActiveFlag(this.clickTarget, this.currentProject, isReselect);
    this.ddRef.close();
  }

  selectParent(location: ImpGeofootprintLocation, alwaysActivate: boolean) : void {
    this.geoService.addGeosToLocation(this.clickTarget, location, this.currentClientLocations, this.currentProject, alwaysActivate);
    this.ddRef.close();
  }

  private prepareData() : void {
    const geoMap = groupByExtended(this.currentGeos, g => g.geocode);
    const clickedGeos = this.clickTarget.map(f => f.attributes['geocode'] as string);
    this.selectableTargetsExist = clickedGeos.some(f => geoMap.get(f)?.some(g => !g.isActive) ?? false);
    this.deSelectableTargetsExist = clickedGeos.some(f => geoMap.get(f)?.some(g => g.isActive) ?? false);
    const locations = this.geoService.calculateLocationDistances(this.clickTarget, this.currentClientLocations);
    this.locationChoices = locations.map(l => ({ label: `${l.location.locationNumber} (${roundTo(l.distance, 2)} miles)`, value: l.location }));
    this.selectedLocation = this.locationChoices[0].value;
    this.dataReady = true;
  }

  private autoSelect() : void {
    if (this.isToggle) {
      this.selectParent(this.currentClientLocations[0], null);
    } else {
      this.selectParent(this.currentClientLocations[0], this.isSelect);
    }
  }
}
