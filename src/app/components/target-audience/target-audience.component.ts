import { Component, OnInit } from '@angular/core';
import { TargetAudienceService } from '../../services/target-audience.service';
import { Observable } from 'rxjs';
import { AudienceDataDefinition } from '../../models/audience-data.model';
import { distinctUntilChanged, filter, map } from 'rxjs/operators';
import { ImpDiscoveryService } from '../../services/ImpDiscoveryUI.service';

@Component({
  selector: 'val-target-audience',
  templateUrl: './target-audience.component.html',
  styleUrls: ['./target-audience.component.css']
})
export class TargetAudienceComponent implements OnInit {
  public audiences$: Observable<AudienceDataDefinition[]>;
  public analysisLevel$: Observable<string>;

  constructor(private audienceService: TargetAudienceService, private discoveryService: ImpDiscoveryService) { }

  ngOnInit() {
    this.audiences$ = this.audienceService.audiences$;
    this.analysisLevel$ = this.discoveryService.storeObservable.pipe(
      filter(disc => disc != null && disc.length > 0 && disc[0].analysisLevel != null && disc[0].analysisLevel !== ''),
      map(disc => disc[0].analysisLevel),
      distinctUntilChanged()
    );
  }

}
