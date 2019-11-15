import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EditCombinedAudiencesComponent } from './edit-combined-audiences.component';

describe('EditCombinedAudiencesComponent', () => {
  let component: EditCombinedAudiencesComponent;
  let fixture: ComponentFixture<EditCombinedAudiencesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EditCombinedAudiencesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EditCombinedAudiencesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
