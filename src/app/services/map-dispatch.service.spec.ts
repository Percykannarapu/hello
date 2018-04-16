import { TestBed, inject } from '@angular/core/testing';

import { MapDispatchService } from './map-dispatch.service';

describe('MapDispatchService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [MapDispatchService]
    });
  });

  it('should be created', inject([MapDispatchService], (service: MapDispatchService) => {
    expect(service).toBeTruthy();
  }));
});
