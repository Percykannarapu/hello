import { Component, OnInit } from '@angular/core';
import { TargetAudienceService } from '../../services/target-audience.service';
import { Observable } from 'rxjs';
import { AudienceDataDefinition } from '../../models/audience-data.model';

@Component({
  selector: 'val-target-audience',
  templateUrl: './target-audience.component.html',
  styleUrls: ['./target-audience.component.css']
})
export class TargetAudienceComponent implements OnInit {
  public audiences$: Observable<AudienceDataDefinition[]>;

  constructor(private audienceService: TargetAudienceService) { }

  ngOnInit() {
    this.audiences$ = this.audienceService.audiences$;
  }

}
