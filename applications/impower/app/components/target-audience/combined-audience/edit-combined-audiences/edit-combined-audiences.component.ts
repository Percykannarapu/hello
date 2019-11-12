import { Component, OnInit, Input, SimpleChanges, Output, EventEmitter } from '@angular/core';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';

@Component({
  selector: 'val-edit-combined-audiences',
  templateUrl: './edit-combined-audiences.component.html',
  styleUrls: ['./edit-combined-audiences.component.scss']
})
export class EditCombinedAudiencesComponent implements OnInit {

  @Input() editAudiences: any[] = [];
  @Output() onEdit = new EventEmitter<Audience>();
  @Output() onDelete = new EventEmitter<Audience>();


  audienceList: any[];

  constructor() { }
  
  ngOnInit() {

    this.audienceList = [
      {field: 'audienceName', header: 'Audience Name'},
    ];
  }

  onEditAudiences(currentAudience: Audience){
    console.log('edit audience::', currentAudience);
    this.onEdit.emit(currentAudience);

  }
  onDeleteAudiences(currentAudience: Audience){
    console.log('delete audience', currentAudience);
    this.onDelete.emit(currentAudience);
  }
  
  formatString(audienceName: string){
    return audienceName.replace(',', '<wbr>');
  }
}
