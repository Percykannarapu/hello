import { TestBed, inject } from '@angular/core/testing';

import { EsriIdentityService } from './esri-identity.service';

describe('EsriIdentityService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EsriIdentityService]
    });
  });

  it('should be created', inject([EsriIdentityService], (service: EsriIdentityService) => {
    expect(service).toBeTruthy();
  }));
});
