import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CombinedAudienceComponent } from './combined-audience.component';

describe('CombinedAudienceComponent', () => {
  let component: CombinedAudienceComponent;
  let fixture: ComponentFixture<CombinedAudienceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CombinedAudienceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CombinedAudienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
