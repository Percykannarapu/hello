import { TestBed } from '@angular/core/testing';

import { ManualGeoService } from './manual-geo.service';

describe('ManualGeoService', () => {
  let service: ManualGeoService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ManualGeoService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
