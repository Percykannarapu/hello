import { Component, OnInit } from '@angular/core';
import { AppPrintingService } from '../../services/app-printing-service';

@Component({
  selector: 'val-dev-tools',
  templateUrl: './dev-tools.component.html',
  styleUrls: ['./dev-tools.component.css']
})
export class DevToolsComponent implements OnInit {

  constructor(private printingService: AppPrintingService) { }

  ngOnInit() {
  }

  public onPrint() {
    this.printingService.createFeatureSet();
  }

}
