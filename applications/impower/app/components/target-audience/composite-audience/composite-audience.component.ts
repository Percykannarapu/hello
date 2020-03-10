import { Component, OnInit, ViewEncapsulation } from '@angular/core';
import { FormBuilder, Validators, FormGroup } from '@angular/forms';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';
import { Observable } from 'rxjs';
import { SelectItem } from 'primeng/api';
import { getAllAudiences } from 'app/impower-datastore/state/transient/audience/audience.selectors';
import { filter, map, tap } from 'rxjs/operators';
import { Store } from '@ngrx/store';
import { LocalAppState } from 'app/state/app.interfaces';
import { mapArray } from '@val/common';

@Component({
  selector: 'val-composite-audience',
  templateUrl: './composite-audience.component.html',
  styleUrls: ['./composite-audience.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class CompositeAudienceComponent implements OnInit {

  compositeForm: FormGroup;
  selectedAudiences: any[];
  // groupedAudiences$: Observable<SelectItem[]>;

  filteredAudiences$: Observable<SelectItem[]>;




  constructor(private fb: FormBuilder,
              private store$: Store<LocalAppState>, ) { }

  ngOnInit() {
    this.compositeForm = this.fb.group({
      compositeAudName: ['', Validators.required],
    });

    this.filteredAudiences$ = this.store$.select(getAllAudiences).pipe(
      filter(audiences => audiences != null),
      tap(aud => console.log('test composite tab::', aud)),
      mapArray(audience => ({label: audience.audienceName, value: audience})),
    );


    this.selectedAudiences = [
      { field: 'audienceName', header: 'Audience Name' },
      { field: 'percent', header: 'Percent' },
      { field: 'index', header: 'Index' },
  ];
      
      // tap(audiences => this.hasAudienceSelections = audiences.length > 0),
      // tap(audienceList => console.log('audience list',audienceList)),
      // map(audList =>  audList.sort((a, b) => a.audienceName.localeCompare(b.audienceName))),
      // mapArray(audience => ({label: audience.audienceName, value: audience})),
      // );
    
    
    



  }

}
