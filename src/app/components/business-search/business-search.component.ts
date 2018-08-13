import { Component, OnInit, EventEmitter, Output, Input } from '@angular/core';
import { AppBusinessSearchService, BusinessSearchCategory, BusinessSearchRequest, BusinessSearchResponse } from '../../services/app-business-search.service';
import { AppMessagingService } from '../../services/app-messaging.service';
import { ImpGeofootprintLocation } from '../../val-modules/targeting/models/ImpGeofootprintLocation';
import { ImpGeofootprintLocationService } from '../../val-modules/targeting/services/ImpGeofootprintLocation.service';
import { ImpMetricName } from '../../val-modules/metrics/models/ImpMetricName';
import { UsageService } from '../../services/usage.service';
import { AppStateService } from '../../services/app-state.service';

interface SelectableSearchResult {
  data: BusinessSearchResponse;
  friendlyName: string;
  friendlyDescription: string;
  selected: boolean;
}

@Component({
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css']
})
export class BusinessSearchComponent implements OnInit {

  public searchResults: SelectableSearchResult[] = [];

  @Input() disableShowBusiness;
  @Output()

  public name: string;  // Used by parent as a header
  public color: any;
  items: any = [];
  dropdownList: any[];
  selectedCategory: any;
  selector: any;
  model: any = {};
  sourceCategories: BusinessSearchCategory[] = [];
  targetCategories: BusinessSearchCategory[] = [];
  filteredCategories: BusinessSearchCategory[] = [];
  competitors: any = [];
  sites: any;
  businessCategories: BusinessSearchCategory[];

  constructor(private appService: AppBusinessSearchService, private messagingService: AppMessagingService,
              private locationService: ImpGeofootprintLocationService, private usageService: UsageService,
              private appStateService: AppStateService) {
    this.dropdownList = [
      { label: 'Apparel & Accessory Stores', value: { name: 'Apparel & Accessory Stores', category: 56 } },
      { label: 'Auto Services', value: { name: 'Auto Services', category: 75 } },
      { label: 'Automotive Dealers & Service Stations', value: { name: 'Automotive Dealers & Service Stations', category: 55 } },
      { label: 'Building Materials & Hardware', value: { name: 'Building Materials & Hardware', category: 52 } },
      { label: 'Business Services', value: { name: 'Business Services', category: 73 } },
      { label: 'Dentists & Doctors', value: { name: 'Dentists & Doctors', category: 80 } },
      { label: 'Depository Institutions', value: { name: 'Depository Institutions', category: 60 } },
      { label: 'Eating & Drinking Places', value: { name: 'Eating & Drinking Places', category: 58 } },
      { label: 'Food Stores', value: { name: 'Food Stores', category: 54 } },
      { label: 'General Merchandise Stores', value: { name: 'General Merchandise Stores', category: 53 } },
      { label: 'Home Furniture & Furnishings Stores', value: { name: 'Home Furniture & Furnishings Stores', category: 57 } },
      { label: 'Leisure Services', value: { name: 'Leisure Services', category: 79 } },
      { label: 'Miscellaneous Retail', value: { name: 'Miscellaneous Retail', category: 59 } },
      { label: 'Personal Services', value: { name: 'Personal Services', category: 72 } },
      { label: 'Schools & Universities', value: { name: 'Schools & Universities', category: 82 } }
    ];
  }

  ngOnInit() : void {
    this.name = 'Business Search';
    this.appService.getCategories().subscribe((data) => {
      this.filteredCategories = data;
      this.selectedCategory = this.dropdownList;
      this.categoryChange();
    });
  }

  categoryChange() : void {
    console.log(this.selectedCategory);
    this.businessCategories = this.filteredCategories.filter((item) => {
      return item.category === this.selectedCategory.category;
    });
    console.log('this.businessCategories', this.businessCategories);
    this.sourceCategories = this.businessCategories.sort(this.sortOn('name'));
  }

  assignCopy() : void {
    this.sourceCategories = Array.from(this.businessCategories);
  }

  filterCategory(value) {
    if (!value) {
      this.assignCopy();
    } else if (value.length > 2) {
      this.sourceCategories = Object.assign([], this.filteredCategories.sort(this.sortOn('name'))).filter((item) => {
        return item.name ? (item.name.toLowerCase().indexOf(value.toLowerCase()) > -1) : false;
      });
    }
  }

  public onSearchBusiness() {
    this.searchResults = [];
      const currentLocations: ImpGeofootprintLocation[] = this.locationService.get().filter(loc => loc.clientLocationTypeCode === 'Site');
    const request: BusinessSearchRequest = {
      radius: this.model.radius,
      name: this.model.name,
      city: this.model.city,
      state: this.model.state,
      zip: this.model.zip,
      countyName: this.model.countyName,
      eliminateBlankFirmNames: 'True',
      siteLimit: '2000',
      sites: currentLocations.map(loc => ({ x: loc.xcoord, y: loc.ycoord, homeGeocode: loc.homeGeocode, locationName: loc.locationName })),
      sics: this.targetCategories.map(category => ({ sic: category.sic }))
    };
    let hasError = false;
    if (request.sites.length === 0) {
      this.messagingService.showErrorNotification('Business Search Error', 'You must have at least one Client Site specified');
      hasError = true;
    }
    if (request.sics.length === 0) {
      this.messagingService.showErrorNotification('Business Search Error', 'You must have at least one SIC specified');
      hasError = true;
    }
    if (request.radius === undefined || request.radius.length === 0) {
      this.messagingService.showErrorNotification('Business Search Error', 'Please enter a radius');
      hasError = true;
    }
    console.log('business Search Request:::', JSON.stringify(request));
    let sic = request.sites != null ? 'SIC=' + request['sics'].map(sic3 =>  sic3.sic ) + '~' : '';
    sic = sic.substring(0, 100);
    const miles = request['radius'] != null ? 'Miles=' + request['radius'] + '~' : '';
    const businessName = request['name'] != null ? 'BusinessName=' + request['name'] + '~' : '';
    const city = request['city'] != null ? 'City=' + request['city'] : '';
    const metricText = sic + miles + businessName + city;
    const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'business-search', action: 'search' });
    if (!hasError) {
      this.messagingService.startSpinnerDialog('businessSearchKey', 'Searching...');
      this.appService.getBusinesses(request).subscribe(
        responseData => {
          this.usageService.createCounterMetric(usageMetricName, metricText, responseData.length);
          responseData.forEach(fuseResult => {
            this.searchResults.push({
              data: fuseResult,
              friendlyName: `${fuseResult.firm} (${Math.round(fuseResult.dist_to_site * 100) / 100} miles)`,
              friendlyDescription: `${fuseResult.address}, ${fuseResult.city}, ${fuseResult.state} ${fuseResult.zip}`,
              selected: false
            });
          });
        },
        err => console.error('There was an error requesting a business search', err),
        () => this.messagingService.stopSpinnerDialog('businessSearchKey')
      );
    }
  }

  private createSiteFromSearchResult(searchResult: BusinessSearchResponse, siteType: string) : ImpGeofootprintLocation {
    const locationId = this.locationService.getNextLocationNumber();
    return new ImpGeofootprintLocation({
      clientLocationTypeCode: siteType,
      locationName: searchResult.firm,
      locAddress: searchResult.address,
      locCity: searchResult.city,
      locState: searchResult.state,
      locZip: searchResult.zip,
      xcoord: searchResult.x,
      ycoord: searchResult.y,
      isActive: true,
      locationNumber: locationId.toString(),
      marketName: searchResult.pricing_market_name,
      recordStatusCode: 'SUCCESS'
    });
  }

  private sortOn(property) {
    return function (a, b) {
      if (a[property] < b[property]) {
        return -1;
      } else if (a[property] > b[property]) {
        return 1;
      } else {
        return 0;
      }
    };
  }

  public onSelectAll(e: boolean) : void {
    this.searchResults.forEach(result => result.selected = e);
  }

  public onAddToProject(siteType: string) : void {
    if (this.selector === 'Site' || this.selector === 'Competitor') {
      const locationsForInsert: ImpGeofootprintLocation[] = [];
      this.searchResults.filter(sr => sr.selected).forEach(result => {
        locationsForInsert.push(this.createSiteFromSearchResult(result.data, siteType));
      });
      const usageMetricName: ImpMetricName = new ImpMetricName({ namespace: 'targeting', section: 'location', target: 'business-search', action: 'import' });
      const metricName = 'Import as ' + siteType;
      this.usageService.createCounterMetric(usageMetricName, metricName, locationsForInsert.length);
      if (locationsForInsert.length > 0) {
        const currentMaster = this.appStateService.currentMaster$.getValue();
        currentMaster.impGeofootprintLocations.push(...locationsForInsert);
        this.locationService.add(locationsForInsert);
        this.appService.closeOverLayPanel.next(true);
      }
    } else {
      this.messagingService.showErrorNotification('Error', `Please select Site or Competitor for importing Business Search results.`);
    }
  }
}
