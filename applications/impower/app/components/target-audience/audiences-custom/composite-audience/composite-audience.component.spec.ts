import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { CompositeAudienceComponent } from './composite-audience.component';

describe('CompositeAudienceComponent', () => {
  let component: CompositeAudienceComponent;
  let fixture: ComponentFixture<CompositeAudienceComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ CompositeAudienceComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CompositeAudienceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
