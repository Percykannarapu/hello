import { TestBed, inject } from '@angular/core/testing';

import { TargetAudienceService } from './target-audience.service';

describe('TargetAudienceService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [TargetAudienceService]
    });
  });

  it('should be created', inject([TargetAudienceService], (service: TargetAudienceService) => {
    expect(service).toBeTruthy();
  }));
});
