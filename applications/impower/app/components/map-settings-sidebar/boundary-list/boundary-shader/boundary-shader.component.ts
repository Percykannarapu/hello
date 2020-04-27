import { Component } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, Validators } from '@angular/forms';
import { BoundaryConfiguration } from '@val/esri';
import { BoundaryBaseComponent } from '../boundary-base.component';

@Component({
  selector: 'val-boundary-shader',
  templateUrl: './boundary-shader.component.html',
  styleUrls: ['./boundary-shader.component.scss']
})
export class BoundaryShaderComponent extends BoundaryBaseComponent<BoundaryConfiguration> {

  constructor(private fb: FormBuilder) {
    super();
  }

  protected convertForm(form: FormGroup) : BoundaryConfiguration {
    return form.value;
  }

  protected setupForm() : void {
    const formSetup: any = {
      showCentroids: new FormControl(this.configuration.showCentroids),
      showLabels: new FormControl(this.configuration.showLabels),
      showHouseholdCounts: new FormControl(this.configuration.showHouseholdCounts),
      showPOBs: new FormControl(this.configuration.showPOBs),
      showPopups: new FormControl(this.configuration.showPopups),
      opacity: new FormControl(this.configuration.opacity, [Validators.required, Validators.min(0), Validators.max(1)]),
    };
    this.configForm = this.fb.group(formSetup);
  }

}
