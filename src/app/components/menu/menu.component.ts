import { Component, OnInit } from '@angular/core';
import { MenubarModule, MenuItem } from 'primeng/primeng';
import { Message } from 'primeng/primeng';

@Component({
  selector: 'val-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

    public items: MenuItem[];
    public menuItems: MenuItem[];

    msgs: Message[] = [];

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
                      {label: 'Competitor Search'},
                      {label: 'Create Composite Variable'},
                      {label: 'Add Alteryx Data'}
                    ]
              }
          ]
      }
  ];

    this.menuItems = [
        {label: 'Competitor Search', icon: 'fa-search', command: () => {
            this.update();
        }},
        {label: 'Composite Variable', icon: 'fa-compress', command: () => {
            this.update();
        }},
        {label: 'Alteryx Data', icon: 'fa-table', command: () => {
            this.update();
        }},
        {label: 'Delete', icon: 'fa-close', command: () => {
            this.delete();
        }},
        {label: 'Angular.io', icon: 'fa-link', url: 'http://angular.io'},
//        {label: 'Theming', icon: 'fa-paint-brush', routerLink: ['/theming']}
        ];
    }

    save() {
        this.msgs = [];
        this.msgs.push({severity: 'info', summary: 'Success', detail: 'Data Saved'});
    }

    update() {
        this.msgs = [];
        this.msgs.push({severity: 'info', summary: 'Success', detail: 'Data Updated'});
    }

    delete() {
        this.msgs = [];
        this.msgs.push({severity: 'info', summary: 'Success', detail: 'Data Deleted'});
    }
}
