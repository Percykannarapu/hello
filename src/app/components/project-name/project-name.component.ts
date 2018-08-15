import { Component, OnInit } from '@angular/core';
import { AppStateService } from '../../services/app-state.service';
import { combineLatest, Observable } from 'rxjs';
import { filter, map } from 'rxjs/operators';

@Component({
  selector: 'val-project-name',
  templateUrl: './project-name.component.html',
  styleUrls: ['./project-name.component.css']
})
export class ProjectNameComponent implements OnInit {

  hasProjectId$: Observable<boolean>;
  projectDisplay$: Observable<string>;

  constructor(private stateService: AppStateService) { }

  ngOnInit() {
    this.hasProjectId$ = this.stateService.currentProject$.pipe(
      map(project => project.projectId != null)
    );
    this.projectDisplay$ = combineLatest(this.hasProjectId$, this.stateService.currentProject$).pipe(
      filter(([hasProject]) => hasProject),
      map(([hasProject, project]) => project),
      map(project => `${project.projectId} - ${project.projectName.substr(0, 40)}${project.projectName.length > 40 ? ' ...' : ''}`)
    );
  }
}
