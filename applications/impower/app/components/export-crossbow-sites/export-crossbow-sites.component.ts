import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { Store } from '@ngrx/store';
import { AppExportService } from 'app/services/app-export.service';
import { AppStateService } from 'app/services/app-state.service';
import { UserService } from 'app/services/user.service';
import { CloseExportCrossbowSitesDialog } from 'app/state/menu/menu.actions';
import { ImpGeofootprintGeoService } from 'app/val-modules/targeting/services/ImpGeofootprintGeo.service';
import { filter, take } from 'rxjs/operators';
import { CrossBowSitesPayload, LocalAppState } from '../../state/app.interfaces';
import { openExportCrossbowSitesFlag } from '../../state/menu/menu.selectors';

@Component({
  selector: 'val-export-crossbow-sites',
  templateUrl: './export-crossbow-sites.component.html'
})

export class ExportCrossbowSitesComponent implements OnInit, AfterViewInit {

  readonly exportColumns: string[] = ['siteId', 'name', 'owner', 'franchisee', 'address', 'city', 'state', 'zip', 'xcoord', 'ycoord'];
  private _showDialog: boolean = false;
  public selectedProfileType: 'mine' | 'group' = 'mine';
  public groups: any[];
  public row: any;
  public selectedGroup: number;
  public isGroupFlag: boolean = false;
  public selectedColumns: any[] = [];
  public profileId: number = -1;
  public profileData: any[] = [];
  public user = this.userService.getUser();
  public payload: CrossBowSitesPayload = {
    email: `${this.user.email}@valassis.com`,
    id: this.user.userId
  };

  public get showDialog() : boolean {
    return this._showDialog;
  }
  public set showDialog(currentValue: boolean) {
    if (currentValue === false && currentValue !== this._showDialog) {
      this.onDialogHide();
    }
    this._showDialog = currentValue;
  }

  public columns: any[] = [
    { field: 'name',                  header: 'Profile Name',                  size: '75%'},
    { field: 'modifiedDate',          header: 'Last Modified Date',            size: '25%'},
  ];

  constructor(
    private store$: Store<LocalAppState>,
    private userService: UserService,
    private stateService: AppStateService,
    private exportService: AppExportService,
    private impGeoService: ImpGeofootprintGeoService,
    private cd: ChangeDetectorRef
  ) {
    this.groups = [];
    this.columns.forEach(column => {
      this.selectedColumns.push(column);
    });
  }

  ngOnInit() {
    this.store$.select(openExportCrossbowSitesFlag).subscribe(flag => this._showDialog = flag);
  }

  ngAfterViewInit() {
    this.stateService.applicationIsReady$.pipe(
      filter(isReady => isReady),
      take(1),
    ).subscribe(() => {
      this.onProfileTypeChange(this.selectedProfileType);
    });
  }

  public onCancel() : void {
    this.onDialogHide();
  }

  public onDialogHide() : void {
    this.store$.dispatch(new CloseExportCrossbowSitesDialog());
  }

  public onProfileTypeChange(value: 'mine' | 'group') {

    this.isGroupFlag = value === 'group' ? true : false;
    this.selectedProfileType = value;
    if (this.selectedProfileType === 'group'){
      this.exportService.getGroups(this.payload).subscribe((data) => {
        const groups = data.payload.rows;
        this.groups = [];
        for ( const group of groups) {
          this.groups.push({label: group[1], value: group[0]});
        }
        this.cd.markForCheck();
      });
    } else {
      this.exportService.getPrivateCrossbowProfiles(this.payload).subscribe((data) => {
        this.selectedGroup = null;
        this.profileData = data.payload.rows;
        this.cd.markForCheck();
      });
    }
  }

  public onSelectingGroup(groupId: number) {
    this.selectedGroup = groupId;
    this.payload.groupId = groupId;
    this.exportService.getGroupProfiles(this.payload).subscribe({
      next: data => this.profileData = data.payload.rows,
      complete: () => this.onProfileTypeChange(this.selectedProfileType)
    });
  }

  public onFilter() : void {
    this.cd.markForCheck();
  }

  public onClick(profileId: number) {

  }

  public onExport(profileId: number) : void {
    this.profileId = profileId;
    this.payload.profileId = profileId;
    this.exportService.getCrossbowSites(this.payload).subscribe((data) => {
      this.getSitesinCsvFile('Profile Sites.csv', data.payload.rows);
    });
    this.onDialogHide();
  }

  getSitesinCsvFile(fileName: string, data: string[]) {
    const csvData: string[] = [];
    const headers: string = 'Site #, Site Name, Owner, Franchisee, Address, City, State, Zip, X, Y';
    csvData.push(headers);
    data.forEach(row => {
      let buffer: string = '';
      this.exportColumns.forEach(column => {
        if (row[column] === null) {
          buffer += '" ",';
         } else {
          buffer += '"' + row[column] + '",';
         }
      });
      csvData.push(buffer);
    });
    this.impGeoService.downloadExport('Profile Sites.csv', csvData);
  }
}
