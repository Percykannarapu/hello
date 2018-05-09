import { TestBed, inject } from '@angular/core/testing';

import { TargetAudienceMetricService } from './target-audience-metric.service';

describe('TargetAudienceMetricService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TargetAudienceMetricService]
    });
  });

  it('should be created', inject([TargetAudienceMetricService], (service: TargetAudienceMetricService) => {
    expect(service).toBeTruthy();
  }));
});
