import { Component, OnInit } from '@angular/core';
import { MenubarModule, MenuItem } from 'primeng/primeng';
import { Message } from 'primeng/primeng';

import { BsModalService } from 'ngx-bootstrap/modal';
import { TypeaheadModule } from 'ngx-bootstrap/typeahead';
import { BsModalRef } from 'ngx-bootstrap/modal/bs-modal-ref.service';
import { BusinessComponent } from '../business/business.component';
import { AppService } from '../../services/app.service';

@Component({
  selector: 'val-menu',
  templateUrl: './menu.component.html',
  styleUrls: ['./menu.component.css']
})
export class MenuComponent implements OnInit {

    public items: MenuItem[];
    public menuItems: MenuItem[];

    bsModalRef: BsModalRef; //nallana:Added US6087
    config = {
      animated: true,
      keyboard: true,
      backdrop: true,
      ignoreBackdropClick: false
    };

    msgs: Message[] = [];
    selected: string;//nallana:Added US6087    

  constructor(private modalService: BsModalService,private appService: AppService) { }

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
            this.openModal();
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
    openModal(){//nallana:Added US6057
        this.bsModalRef = this.modalService.show(BusinessComponent, {class: 'modal-lg'});
        this.bsModalRef.content.title = 'Modal with component';
        this.bsModalRef.content.leftList = this.appService.categoriesList;

    }
}
