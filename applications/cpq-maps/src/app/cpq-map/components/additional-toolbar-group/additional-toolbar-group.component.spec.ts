import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AdditionalToolbarGroupComponent } from './additional-toolbar-group.component';

describe('AdditionalToolbarGroupComponent', () => {
  let component: AdditionalToolbarGroupComponent;
  let fixture: ComponentFixture<AdditionalToolbarGroupComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AdditionalToolbarGroupComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AdditionalToolbarGroupComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
