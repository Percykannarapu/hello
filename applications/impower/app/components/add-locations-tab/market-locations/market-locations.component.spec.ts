import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MarketLocationsComponent } from './market-locations.component';

describe('MarketLocationsComponent', () => {
  let component: MarketLocationsComponent;
  let fixture: ComponentFixture<MarketLocationsComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketLocationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
