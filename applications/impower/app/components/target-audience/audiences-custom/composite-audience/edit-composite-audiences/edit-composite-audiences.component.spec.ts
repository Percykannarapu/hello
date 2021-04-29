import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';

import { EditCompositeAudiencesComponent } from './edit-composite-audiences.component';

describe('EditCompositeAudiencesComponent', () => {
  let component: EditCompositeAudiencesComponent;
  let fixture: ComponentFixture<EditCompositeAudiencesComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCompositeAudiencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCompositeAudiencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
