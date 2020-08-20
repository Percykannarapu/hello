import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CompositeAudienceComponent } from './composite-audience.component';

describe('CompositeAudienceComponent', () => {
  let component: CompositeAudienceComponent;
  let fixture: ComponentFixture<CompositeAudienceComponent>;

  beforeEach(async(() => {
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
