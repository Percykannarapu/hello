import { TestBed } from '@angular/core/testing';

import { TargetAudienceUnifiedService } from './target-audience-unified.service';

describe('TargetAudienceUnifiedService', () => {
  beforeEach(() => TestBed.configureTestingModule({}));

  it('should be created', () => {
    const service: TargetAudienceUnifiedService = TestBed.get(TargetAudienceUnifiedService);
    expect(service).toBeTruthy();
  });
});
