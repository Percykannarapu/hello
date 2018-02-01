import { TestBed, inject } from '@angular/core/testing';

import { GfGeoService } from './gf-geo.service';

describe('GfGeoService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [GfGeoService]
    });
  });

  it('should be created', inject([GfGeoService], (service: GfGeoService) => {
    expect(service).toBeTruthy();
  }));
});
