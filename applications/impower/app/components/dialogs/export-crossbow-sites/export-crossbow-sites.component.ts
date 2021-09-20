import { Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { ExportHeader } from '@val/common';
import { ErrorNotification } from '@val/messaging';
import { AppExportService } from 'app/services/app-export.service';
import { SelectItem } from 'primeng/api';
import { DynamicDialogConfig, DynamicDialogRef } from 'primeng/dynamicdialog';
import { of } from 'rxjs';
import { catchError, map, tap } from 'rxjs/operators';
import { SimpleGridColumn } from '../../../common/ui-helpers';
import { CrossbowGroupTuple, CrossbowProfile, CrossbowProfileResponse, CrossbowSite } from '../../../models/crossbow.model';
import { User } from '../../../models/User';
import { FullAppState } from '../../../state/app.interfaces';
import { FileService } from '../../../val-modules/common/services/file.service';
import * as Papa from 'papaparse';

@Component({
  templateUrl: './export-crossbow-sites.component.html'
})
export class ExportCrossbowSitesComponent implements OnInit {

  public selectedProfileType: 'mine' | 'group' = 'mine';
  public selectedGroupId: number;

  public groups: SelectItem[] = [];

  public profileData: CrossbowProfile[] = [];
  public selectedProfile: CrossbowProfile;

  public gettingData = false;

  public columns: SimpleGridColumn[] = [
    // @formatter:off
    { field: 'name',         header: 'Profile Name',       width: '75%' },
    { field: 'modifiedDate', header: 'Last Modified Date', width: '25%' },
    // @formatter:on
  ];

  private userId: number;

  constructor(private ddConfig: DynamicDialogConfig,
              private ddRef: DynamicDialogRef,
              private exportService: AppExportService,
              private store$: Store<FullAppState>) {}

  ngOnInit() {
    const user: User = this.ddConfig.data.user;
    this.userId = user.userId;
    this.gettingData = true;
    this.exportService.getGroups(this.userId).pipe(
      tap({ error: () => this.store$.dispatch(ErrorNotification({ message: 'There was an error retrieving the list of groups. Please close the dialog and try again.' }))}),
      map(response => response.payload.rows),
      catchError(() => of([] as CrossbowGroupTuple[]))
    ).subscribe((data) => {
      this.groups = data.map(tuple => ({ label: tuple[1], value: tuple[0] }));
    });
    this.getUserProfiles();
  }

  private getUserProfiles() : void {
    this.gettingData = true;
    this.exportService.getProfilesForUser(this.userId).pipe(
      tap({ error: () => this.store$.dispatch(ErrorNotification({ message: 'There was an error retrieving the list of profiles. Please close the dialog and try again.' }))}),
      map(response => response.payload.rows),
      catchError(() => of([] as CrossbowProfileResponse[]))
    ).subscribe((data) => {
      this.profileData = data.map(r => new CrossbowProfile(r));
      this.gettingData = false;
    });
  }

  private getGroupProfiles(groupId: number) : void {
    this.gettingData = true;
    this.exportService.getProfilesForGroup(groupId).pipe(
      tap({ error: () => this.store$.dispatch(ErrorNotification({ message: 'There was an error retrieving the list of profiles. Please close the dialog and try again.' }))}),
      map(response => response.payload.rows),
      catchError(() => of([] as CrossbowProfileResponse[]))
    ).subscribe(data => {
      this.profileData = data.map(r => new CrossbowProfile(r));
      this.gettingData = false;
    });
  }

  public onProfileTypeChange(value: 'mine' | 'group') {
    if (value === 'mine') {
      this.selectedGroupId = null;
      this.getUserProfiles();
    } else {
      this.profileData = [];
    }
  }

  public onGroupChange(groupId: number) {
    this.getGroupProfiles(groupId);
  }

  public onExport() : void {
    this.exportService.getSitesForProfile(this.selectedProfile.profileId).pipe(
      tap({ error: () => this.store$.dispatch(ErrorNotification({ message: 'There was an error retrieving the profile. Please try again.' }))}),
      map(response => response.payload.rows),
      catchError(() => of([] as CrossbowSite[]))
    ).subscribe((data) => {
      this.exportSites(data);
      this.ddRef.close();
    });
  }

  exportSites(data: (CrossbowSite | ExportHeader<CrossbowSite>)[]) {
    const exportColumnOrder: string[] = ['siteId', 'name', 'owner', 'franchisee', 'address', 'city', 'state', 'zip', 'xcoord', 'ycoord'];
    const headers: ExportHeader<CrossbowSite> = {
      siteId: 'Site #',
      name: 'Site Name',
      owner: 'Owner',
      franchisee: 'Franchisee',
      address: 'Address',
      city: 'City',
      state: 'State',
      zip: 'Zip',
      xcoord: 'X',
      ycoord: 'Y'
    };
    data.unshift(headers);
    const result = Papa.unparse(data, {
      columns: exportColumnOrder,
      skipEmptyLines: 'greedy',
      header: false
    });
    FileService.downloadDelimitedFile('Profile Sites.csv', result);
  }
}
