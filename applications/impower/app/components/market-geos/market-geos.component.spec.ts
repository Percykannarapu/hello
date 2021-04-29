import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { MarketGeosComponent } from './market-geos.component';

describe('MarketGeosComponent', () => {
  let component: MarketGeosComponent;
  let fixture: ComponentFixture<MarketGeosComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ MarketGeosComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MarketGeosComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
