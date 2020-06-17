import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { Audience } from 'app/impower-datastore/state/transient/audience/audience.model';

@Component({
  selector: 'val-edit-composite-audiences',
  templateUrl: './edit-composite-audiences.component.html',
  styleUrls: ['./edit-composite-audiences.component.scss']
})
export class EditCompositeAudiencesComponent implements OnInit {

  @Input() editAudiences: any[] = [];
  @Output() onEdit = new EventEmitter<Audience>();
  @Output() onDelete = new EventEmitter<Audience>();


  audienceList: any[];

  constructor() { }
  
  ngOnInit() {

    this.audienceList = [
      {field: 'audienceName', header: 'Audience Name', width: '30em'}
    ];
  }

  onEditAudiences(currentAudience: Audience){
    this.onEdit.emit(currentAudience);

  }
  onDeleteAudiences(currentAudience: Audience){
    this.onDelete.emit(currentAudience);
  }
  
  formatString(combinedVariables: string){
    let formattedString = combinedVariables != null ? combinedVariables : '';
    formattedString = formattedString.replace(/[~]/g, '<br>');
    return formattedString;
  }
}
