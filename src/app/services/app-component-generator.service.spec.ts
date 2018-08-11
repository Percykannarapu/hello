import { TestBed, inject } from '@angular/core/testing';

import { AppComponentGeneratorService } from './app-component-generator.service';

describe('AppComponentGeneratorService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AppComponentGeneratorService]
    });
  });

  it('should be created', inject([AppComponentGeneratorService], (service: AppComponentGeneratorService) => {
    expect(service).toBeTruthy();
  }));
});
