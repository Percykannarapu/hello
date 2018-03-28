import { TestBed, inject } from '@angular/core/testing';

import { UsageService } from './usage.service';

describe('MetricsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [UsageService]
    });
  });

  it('should be created', inject([UsageService], (service: UsageService) => {
    expect(service).toBeTruthy();
  }));
});
