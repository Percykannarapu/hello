import { TestBed, inject } from '@angular/core/testing';

import { RadService } from './rad.service';

describe('RadService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [RadService]
    });
  });

  it('should be created', inject([RadService], (service: RadService) => {
    expect(service).toBeTruthy();
  }));
});
