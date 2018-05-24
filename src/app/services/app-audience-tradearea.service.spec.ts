import { TestBed, inject } from '@angular/core/testing';

import { ValAudienceTradeareaService } from './app-audience-tradearea.service';

describe('AppAudienceTradeareaService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [ValAudienceTradeareaService]
    });
  });

  it('should be created', inject([ValAudienceTradeareaService], (service: ValAudienceTradeareaService) => {
    expect(service).toBeTruthy();
  }));
});
