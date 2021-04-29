import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { AudienceTradeareaComponent } from './audience-tradearea.component';

describe('AudienceTradeareaComponent', () => {
  let component: AudienceTradeareaComponent;
  let fixture: ComponentFixture<AudienceTradeareaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ AudienceTradeareaComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AudienceTradeareaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
