import { ImpRadLookup } from '../val-modules/targeting/models/ImpRadLookup';
import { ImpProject } from '../val-modules/targeting/models/ImpProject';
import { ProjectTrackerData } from '../services/app-discovery.service';
import { ProjectCpmTypeCodes } from '../val-modules/targeting/targeting.enums';

export class ValDiscoveryUIModel {
  projectId: number;
  projectName: string;
  selectedProjectTracker: ProjectTrackerData;
  selectedRadLookup: ImpRadLookup;
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

  public static createFromProject(project: ImpProject, radItem: ImpRadLookup, trackerItem: ProjectTrackerData) : ValDiscoveryUIModel {
    console.log('Creating a new form', project);
    const newFormValues = {
      projectId: project.projectId,
      projectName: project.projectName,
      circulationBudget: project.isCircBudget && project.totalBudget ? project.totalBudget.toString() : null,
      dollarBudget: project.isDollarBudget && project.totalBudget ? project.totalBudget.toString() : null,
      cpmAnne: project.smAnneCpm ? project.smAnneCpm.toString() : null,
      cpmValassis: project.smValassisCpm ? project.smValassisCpm.toString() : null,
      cpmSolo: project.smSoloCpm ? project.smSoloCpm.toString() : null,
      cpmBlended: project.estimatedBlendedCpm ? project.estimatedBlendedCpm.toString() : null,
      cpmType: project.estimatedBlendedCpm ? ProjectCpmTypeCodes.Blended : (project.smAnneCpm || project.smSoloCpm || project.smValassisCpm ? ProjectCpmTypeCodes.OwnerGroup : null),
      includeAnne: project.isIncludeAnne == null ? true : project.isIncludeAnne,
      includeSolo: project.isIncludeSolo == null ? true : project.isIncludeSolo,
      includeValassis: project.isIncludeValassis == null ? true : project.isIncludeValassis,
      includePob: project.isExcludePob == null ? true : !project.isExcludePob,
      selectedAnalysisLevel: project.methAnalysis,
      selectedSeason: project.impGeofootprintMasters[0].methSeason,
      projectTrackerData: trackerItem ? trackerItem : null,
      selectedRadLookupValue: radItem ? radItem : null
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
    projectToUpdate.clientIdentifierTypeCode = 'CAR_LIST';
    projectToUpdate.clientIdentifierName     =  this.selectedProjectTracker ? this.selectedProjectTracker.clientName : null;
    projectToUpdate.customerNumber           =  this.selectedProjectTracker && this.selectedProjectTracker.accountNumber ? this.selectedProjectTracker.accountNumber : null;
    projectToUpdate.consumerPurchFreqCode    = 'REMINDER';
    projectToUpdate.goalCode                 = 'ACQUISITION';
    projectToUpdate.objectiveCode            = 'INCREASE_PENETRATION';
    projectToUpdate.industryCategoryCode     = this.selectedRadLookup != null ? this.selectedRadLookup['Category Code'] : '';
    projectToUpdate.methAnalysis       = this.selectedAnalysisLevel;
    projectToUpdate.totalBudget        = (dollarBudget != null && dollarBudget !== 0 ? dollarBudget : circBudget);
    projectToUpdate.isValidated        = true;
    projectToUpdate.isCircBudget       = (circBudget != null && circBudget !== 0);
    projectToUpdate.isActive           = true;
    projectToUpdate.isSingleDate       = true;
    projectToUpdate.isMustCover        = true;
    projectToUpdate.isDollarBudget     = (dollarBudget != null && dollarBudget !== 0);
    projectToUpdate.isRunAvail         = true;
    projectToUpdate.isHardPdi          = true;
    projectToUpdate.isIncludeNonWeekly = true;
    projectToUpdate.isIncludeValassis  = this.includeValassis;
    projectToUpdate.isExcludePob       = !this.includePob;
    projectToUpdate.isIncludeAnne      = this.includeAnne;
    projectToUpdate.isIncludeSolo      = this.includeSolo;
    projectToUpdate.projectTrackerId   = this.selectedProjectTracker != null ? this.selectedProjectTracker.projectId : null;
    projectToUpdate.projectName        = this.projectName;
    projectToUpdate.estimatedBlendedCpm = this.toNumber(this.cpmBlended);
    projectToUpdate.smValassisCpm      = this.toNumber(this.cpmValassis);
    projectToUpdate.smAnneCpm          = this.toNumber(this.cpmAnne);
    projectToUpdate.smSoloCpm          = this.toNumber(this.cpmSolo);
    projectToUpdate.radProduct         = this.selectedRadLookup ? this.selectedRadLookup.product : null;
    projectToUpdate.impGeofootprintMasters[0].methSeason = this.selectedSeason;
  }

  private toNumber(value: string) : number | null {
    const result: number = Number(value);
    if (value == null || value.trim() === '' || Number.isNaN(result)) return null;
    return result;
  }
}
