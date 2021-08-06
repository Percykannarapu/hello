import { ComponentFixture, TestBed, waitForAsync } from '@angular/core/testing';
import { ButtonModule } from 'primeng/button';
import { DialogModule } from 'primeng/dialog';

import { ConfirmationDialogComponent } from './confirmation-dialog.component';

describe('ConfirmationDialogComponent', () => {
  let component: ConfirmationDialogComponent;
  let fixture: ComponentFixture<ConfirmationDialogComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      imports: [ DialogModule, ButtonModule ],
      declarations: [ ConfirmationDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ConfirmationDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    document.body.removeChild(fixture.nativeElement);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should emit closed when dialogVisible set false from visible dialog', () => {
    component.isVisible = true;
    spyOn(component.closed, 'emit');

    component.dialogVisible = false;

    expect(component.closed.emit).toHaveBeenCalled();
  });

  it('should not emit closed when dialogVisible set false from hidden dialog', () => {
    component.isVisible = false;
    spyOn(component.closed, 'emit');

    component.dialogVisible = false;

    expect(component.closed.emit).not.toHaveBeenCalled();
  });
});
