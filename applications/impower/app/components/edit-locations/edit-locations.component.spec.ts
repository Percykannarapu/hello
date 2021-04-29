import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditLocationsComponent } from './edit-locations.component';

describe('EditLocationsComponent', () => {
  let component: EditLocationsComponent;
  let fixture: ComponentFixture<EditLocationsComponent>;

  beforeEach(waitForAsync(() => {
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
