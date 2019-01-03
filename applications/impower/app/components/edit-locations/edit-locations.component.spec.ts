import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditLocationsComponent } from './edit-locations.component';

describe('EditLocationsComponent', () => {
  let component: EditLocationsComponent;
  let fixture: ComponentFixture<EditLocationsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditLocationsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditLocationsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
