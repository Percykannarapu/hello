import { TestBed, inject } from '@angular/core/testing';

import { EsriLoaderWrapperService } from './esri-loader-wrapper.service';

describe('EsriLoaderWrapperService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [EsriLoaderWrapperService]
    });
  });

  it('should be created', inject([EsriLoaderWrapperService], (service: EsriLoaderWrapperService) => {
    expect(service).toBeTruthy();
  }));
});
