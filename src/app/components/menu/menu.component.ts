import { Component, OnInit } from '@angular/core';
import { MenubarModule, MenuItem } from 'primeng/primeng';

@Component({
  selector: 'val-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

  public items: MenuItem[];

  constructor() { }

  ngOnInit() {
    this.items = [
      {
          label: 'File',
          items: [{
                  label: 'Targeting Project', 
                  icon: 'fa-plus',
                  items: [
                      {label: 'New'},
                      {label: 'Load'},
                  ]
              },
              {label: 'Logout'}
          ]
      },
      {
          label: 'View',
          icon: 'fa-edit',
          items: [{
                    label: 'Targeting Toolbox', 
                    icon: 'fa-mail-forward',
                    items: [
                      {label: "Competitor Search"},
                      {label: "Create Composite Variable"},
                      {label: "Add Alteryx Data"}
                    ]
              }
          ]
      }
  ];
  }

}
