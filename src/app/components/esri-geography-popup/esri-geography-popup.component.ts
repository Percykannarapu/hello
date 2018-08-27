import { Component, DoCheck, Input, OnDestroy, OnInit } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { combineLatest, Subscription } from 'rxjs';
import { distinctUntilChanged, filter, map, skip } from 'rxjs/operators';
import { CustomPopUpDefinition } from '../../../environments/environment-definitions';
import { TargetAudienceService } from '../../services/target-audience.service';
import { ImpGeofootprintVar } from '../../val-modules/targeting/models/ImpGeofootprintVar';
import { ImpGeofootprintVarService } from '../../val-modules/targeting/services/ImpGeofootprintVar.service';

interface AttributeFields {
  fieldName: string;
  label?: string;
  visible?: boolean;
}

@Component({
  selector: 'val-esri-geometry-popup',
  templateUrl: 'esri-geography-popup.component.html'
})
export class EsriGeographyPopupComponent implements OnInit, DoCheck, OnDestroy {

  currentGeocode: string = null;
  data: TreeNode[];

  @Input('geocode') set geocode(value: string) {
    if (value !== this.currentGeocode) {
      this.currentGeocode = value;
      this.dataChanged = true;
    }
  }
  @Input() attributes: { [key: string] : any };
  @Input() attributeFields: AttributeFields[];
  @Input() customPopupDefinition: CustomPopUpDefinition;

  private dataChanged: boolean = false;
  private nodeExpandState: { [key: string] : boolean } = {};
  private varSub: Subscription;

  constructor(private varService: ImpGeofootprintVarService, private audienceService: TargetAudienceService) { }

  private buildAttributeNodes(attributes: AttributeFields[]) : TreeNode[] {
    return attributes.map(field => ({
      data: {
        name: field.label,
        value: this.attributes[field.fieldName],
        isNumber: !Number.isNaN(Number(this.attributes[field.fieldName])),
        digitsInfo: '1.0-2'
      },
      leaf: true
    }));
  }

  private buildVarNode(geoVar: ImpGeofootprintVar) : TreeNode {
    const fieldType = (geoVar.fieldconte || '').toUpperCase();
    const digits: number = fieldType === 'RATIO' || fieldType === 'PERCENT' ? 2 : 0;
    const digitsInfo = `1.${digits}-${digits}`;
    return {
      data: {
        name: geoVar.customVarExprDisplay,
        value: geoVar.isNumber ? geoVar.valueNumber : geoVar.valueString,
        isNumber: geoVar.isNumber,
        digitsInfo: digitsInfo
      },
      leaf: true
    };
  }

  ngOnInit() {
    this.init();
    const geoVar$ = this.varService.storeObservable.pipe(skip(1));
    const mapVar$ = this.audienceService.shadingData$.pipe(
      filter(dataDictionary => dataDictionary.has(this.currentGeocode)),
      map(dataDictionary => dataDictionary.get(this.currentGeocode)),
      distinctUntilChanged()
    );
    this.varSub = combineLatest(geoVar$, mapVar$).subscribe(() => this.dataChanged = true);
  }

  ngOnDestroy() {
    if (this.varSub) this.varSub.unsubscribe();
  }

  ngDoCheck() {
    if (this.dataChanged) this.init();
  }

  onExpand(node: TreeNode) {
    this.nodeExpandState[node.data.name] = true;
  }

  onCollapse(node: TreeNode) {
    this.nodeExpandState[node.data.name] = false;
  }

  private init() {
    const results = this.getDataTree();
    results.forEach(node => {
      if (this.nodeExpandState[node.data.name] === true) {
        node.expanded = true;
      }
    });
    this.data = results;
    this.dataChanged = false;
  }

  private getDataTree() : TreeNode[] {
    const result: TreeNode[] = [];
    result.push(this.getShadingNode());
    result.push(...this.getRootAttributeNodes());
    result.push(this.getSelectedVariableTree());
    result.push(this.getStandardVariableTree());
    return result.filter(node => node != null);
  }

  private getShadingNode() : TreeNode {
    const shadingVar = this.audienceService.getShadingVar(this.currentGeocode);
    if (shadingVar) {
      return this.buildVarNode(shadingVar);
    }
    return null;
  }

  private getRootAttributeNodes() : TreeNode[] {
    const rootNameSet = new Set<string>(this.customPopupDefinition.rootFields);
    const rootAttributes = this.attributeFields.filter(f => rootNameSet.has(f.fieldName));
    return this.buildAttributeNodes(rootAttributes);
  }

  private getSelectedVariableTree() : TreeNode {
    const geoVars = this.varService.get().filter(v => v.geocode === this.currentGeocode);
    if (geoVars.length === 0) return null;
    return {
      data: {
        name: 'Selected Audiences',
        value: ''
      },
      leaf: false,
      expanded: false,
      children: geoVars.map(v => this.buildVarNode(v))
    };
  }

  private getStandardVariableTree() : TreeNode {
    const standardNameSet = new Set<string>(this.customPopupDefinition.standardFields);
    const standardAttributes = this.attributeFields.filter(f => standardNameSet.has(f.fieldName));
    return {
      data: {
        name: 'Standard Variables',
        value: ''
      },
      leaf: false,
      expanded: false,
      children: this.buildAttributeNodes(standardAttributes)
    };
  }
}
