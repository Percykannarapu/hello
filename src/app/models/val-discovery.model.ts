import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ProjectCpmTypeCodes } from '../val-modules/targeting/targeting.enums';
import { ImpProjectPref } from '../val-modules/targeting/models/ImpProjectPref';
import { ProjectTrackerUIModel, RadLookupUIModel } from '../services/app-discovery.service';
import { AppLoggingService } from '../services/app-logging.service';

export class ValDiscoveryUIModel {
  projectId: number;
  projectName: string;
  selectedProjectTracker: ProjectTrackerUIModel;
  selectedRadLookup: RadLookupUIModel;
  selectedSeason: string;
  selectedAnalysisLevel: string;
  includePob: boolean;
  includeValassis: boolean;
  includeAnne: boolean;
  includeSolo: boolean;
  dollarBudget: string;
  circulationBudget: string;
  cpmType: ProjectCpmTypeCodes;
  cpmBlended: string;
  cpmValassis: string;
  cpmAnne: string;
  cpmSolo: string;
  
  constructor(formData: Partial<ValDiscoveryUIModel>) {
      Object.assign(this, formData);
  }

  private static isSummer() : boolean {
    const today: Date = new Date();
    today.setDate(today.getDate() + 28);
    return today.getMonth() >= 4 && today.getMonth() <= 8;
  }

  public static createFromProject(project: ImpProject, radItem: RadLookupUIModel, trackerItem: ProjectTrackerUIModel) : ValDiscoveryUIModel {
    const cpmTypeAttribute = project.impProjectPrefs.filter(pref => pref.attributeCode === 'CPM_TYPE')[0];
    const materializedCpmType = project.estimatedBlendedCpm ? ProjectCpmTypeCodes.Blended : (project.smAnneCpm || project.smSoloCpm || project.smValassisCpm ? ProjectCpmTypeCodes.OwnerGroup : null);
    const usableCpmType = cpmTypeAttribute != null ? ProjectCpmTypeCodes.parse(cpmTypeAttribute.attributeValue) : materializedCpmType;
    const newFormValues = {
      projectId: project.projectId,
      projectName: project.projectName,
      circulationBudget: project.isCircBudget && project.totalBudget ? project.totalBudget.toString() : null,
      dollarBudget: project.isDollarBudget && project.totalBudget ? project.totalBudget.toString() : null,
      cpmAnne: project.smAnneCpm ? project.smAnneCpm.toString() : null,
      cpmValassis: project.smValassisCpm ? project.smValassisCpm.toString() : null,
      cpmSolo: project.smSoloCpm ? project.smSoloCpm.toString() : null,
      cpmBlended: project.estimatedBlendedCpm ? project.estimatedBlendedCpm.toString() : null,
      cpmType: usableCpmType,
      includeAnne: project.isIncludeAnne == null ? true : project.isIncludeAnne,
      includeSolo: project.isIncludeSolo == null ? true : project.isIncludeSolo,
      includeValassis: project.isIncludeValassis == null ? true : project.isIncludeValassis,
      includePob: project.isExcludePob == null ? true : !project.isExcludePob,
      selectedAnalysisLevel: project.methAnalysis,
      selectedSeason: project.impGeofootprintMasters[0].methSeason,
      selectedProjectTracker: trackerItem ? trackerItem : null,
      selectedRadLookup: radItem ? radItem : null
    };
    if (newFormValues.selectedSeason == null || newFormValues.selectedSeason === '') {
      newFormValues.selectedSeason = this.isSummer() ? 'S' : 'W';
    }
    return new ValDiscoveryUIModel(newFormValues);
  }
  
  public updateProjectItem(projectToUpdate: ImpProject) : void {
    const dollarBudget = this.toNumber(this.dollarBudget);
    const circBudget = this.toNumber(this.circulationBudget);
    // Populate the ImpProject model

    projectToUpdate.clientIdentifierName     =  this.selectedProjectTracker ? this.selectedProjectTracker.clientName : null;
    projectToUpdate.customerNumber           =  this.selectedProjectTracker && this.selectedProjectTracker.accountNumber ? this.selectedProjectTracker.accountNumber : null;
    projectToUpdate.industryCategoryCode     = this.selectedRadLookup != null ? this.selectedRadLookup['Category Code'] : '';
    projectToUpdate.methAnalysis       = this.selectedAnalysisLevel;
    projectToUpdate.totalBudget        = (dollarBudget != null && dollarBudget !== 0 ? dollarBudget : circBudget);
    projectToUpdate.isCircBudget       = (circBudget != null && circBudget !== 0);
    projectToUpdate.isDollarBudget     = (dollarBudget != null && dollarBudget !== 0);
    projectToUpdate.isIncludeValassis  = this.includeValassis;
    projectToUpdate.isExcludePob       = !this.includePob;
    projectToUpdate.isIncludeAnne      = this.includeAnne;
    projectToUpdate.isIncludeSolo      = this.includeSolo;
    projectToUpdate.projectTrackerId   = this.selectedProjectTracker != null && this.selectedProjectTracker.projectId != null ? this.selectedProjectTracker.projectId : null;
    projectToUpdate.projectName        = this.selectedProjectTracker != null && this.selectedProjectTracker.projectName != null && this.projectName == null ? this.selectedProjectTracker.projectName : this.projectName ;
    projectToUpdate.estimatedBlendedCpm = this.toNumber(this.cpmBlended);
    projectToUpdate.smValassisCpm      = this.toNumber(this.cpmValassis);
    projectToUpdate.smAnneCpm          = this.toNumber(this.cpmAnne);
    projectToUpdate.smSoloCpm          = this.toNumber(this.cpmSolo);
    projectToUpdate.radProduct         = this.selectedRadLookup ? this.selectedRadLookup.product : null;
    projectToUpdate.impGeofootprintMasters[0].methSeason = this.selectedSeason;

    let cpmTypeAttribute = projectToUpdate.impProjectPrefs.filter(pref => pref.attributeCode === 'CPM_TYPE')[0];
    if (cpmTypeAttribute == null) {
      cpmTypeAttribute = new ImpProjectPref({ attributeCode: 'CPM_TYPE', isActive: true });
      projectToUpdate.impProjectPrefs.push(cpmTypeAttribute);
    }
    cpmTypeAttribute.attributeValue = this.cpmType;
    console.log('Discovery Form changed, new Project values:', projectToUpdate);
  }

  private toNumber(value: string) : number | null {
    const result: number = Number(value);
    if (value == null || value.trim() === '' || Number.isNaN(result)) return null;
    return result;
  }
}