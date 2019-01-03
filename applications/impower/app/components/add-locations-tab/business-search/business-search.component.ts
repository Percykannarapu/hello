import { ChangeDetectionStrategy, Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { BusinessSearchCategory, BusinessSearchResponse } from '../../../services/app-business-search.service';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, map } from 'rxjs/operators';

export interface SearchEventData {
  name: string;
  city: string;
  state: string;
  zip: string;
  countyName: string;
  // marketCode: string;
  radius: string;
  sics: { sic: string }[];
}

interface SearchForm {
  businessName: string;
  businessCity: string;
  businessState: string;
  businessZip: string;
  countyFips: string;
  marketCode: string;
  distance: string;
}

@Component({
  selector: 'val-business-search',
  templateUrl: './business-search.component.html',
  styleUrls: ['./business-search.component.css'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class BusinessSearchComponent implements OnInit {

  @Input() allCategories: BusinessSearchCategory[];
  @Input('searchResults') set searchResults(data: BusinessSearchResponse[]) {
    this.searchResultList = data.map(result => ({ label: JSON.stringify(result), value: result }));
  }
  @Input() currentLocationCount: number = 0;
  @Input() resultLimit: number;
  @Output() searchForBusinesses = new EventEmitter<SearchEventData>();
  @Output() addResultsToProject = new EventEmitter<{ siteType: string, businesses: BusinessSearchResponse[] }>();

  sourceCategories$: Observable<BusinessSearchCategory[]>;
  targetCategories: BusinessSearchCategory[] = [];

  searchResultList: { label: string, value: BusinessSearchResponse }[] = [];
  selectedSearchResults: BusinessSearchResponse[] = [];

  sicSearchTerm$ = new Subject<string>();
  businessSearchForm: FormGroup;
  searchResultForm: FormGroup;
  
  constructor(private fb: FormBuilder) {}

  ngOnInit() : void {
    this.businessSearchForm = this.fb.group({
      businessName: '',
      businessCity: '',
      businessState: '',
      businessZip: '',
      countyFips: '',
      marketCode: '',
      distance: ['', Validators.required]
    });
    this.searchResultForm = this.fb.group({
      siteType: ['', Validators.required]
    });
    this.sourceCategories$ = this.sicSearchTerm$.pipe(
      debounceTime(250),
      filter(term => term != null && term.length > 1 && this.allCategories != null && this.allCategories.length > 0),
      distinctUntilChanged(),
      map(term => this.allCategories.filter(category => category.name.toLowerCase().includes(term.toLowerCase()))),
    );
  }

  hasErrors(controlKey: string) : boolean {
    const control = this.businessSearchForm.get(controlKey);
    return control.errors != null;
  }

  onSearchForBusinesses() : void {
    const formData = this.businessSearchForm.value as SearchForm;
    const eventData: SearchEventData = {
      name: formData.businessName,
      city: formData.businessCity,
      state: formData.businessState,
      zip: formData.businessZip,
      countyName: formData.countyFips,
      radius: formData.distance,
      sics: this.targetCategories.map(cat => ({ sic: cat.sic }))
    };
    this.searchForBusinesses.emit(eventData);
  }

  onAddResults() : void {
    const siteType = this.searchResultForm.get('siteType').value;
    this.addResultsToProject.emit({ siteType, businesses: this.selectedSearchResults });
  }

  clear() : void {
    this.targetCategories = [];
    this.searchResults = [];
    this.businessSearchForm.reset();
    this.searchResultForm.reset();
  }
}
