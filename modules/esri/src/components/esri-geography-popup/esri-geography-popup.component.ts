import { Component, DoCheck, Input, OnInit, ViewEncapsulation } from '@angular/core';
import { TreeNode } from 'primeng/api';
import { PopupDefinition } from '../../models/boundary-configuration';

interface AttributeFields {
  fieldName: string;
  label?: string;
  visible?: boolean;
}

export interface NodeVariable {
  digitRounding: number;
  name: string;
  value: any;
  isNumber: boolean;
}

@Component({
  selector: 'val-esri-geometry-popup',
  templateUrl: 'esri-geography-popup.component.html',
  styleUrls: ['./esri-geography-popup.component.css'],
  encapsulation: ViewEncapsulation.None
})
export class EsriGeographyPopupComponent implements OnInit, DoCheck {

  currentGeocode: string = null;
  data: TreeNode[];

  @Input('geocode') set geocode(value: string) {
    if (value !== this.currentGeocode) {
      this.currentGeocode = value;
      this.dataChanged = true;
    }
  }
  @Input('geoVars') set geoVars(value: NodeVariable[]) {
    if (value !== this.currentGeoVars) {
      this.currentGeoVars = value;
      this.dataChanged = true;
    }
  }
  @Input('mapVar') set mapVar(value: NodeVariable) {
    if (value !== this.currentMapVar) {
      this.currentMapVar = value;
      this.dataChanged = true;
    }
  }
  @Input() attributes: { [key: string] : any };
  @Input() attributeFields: AttributeFields[];
  @Input() customPopupDefinition: PopupDefinition;

  private dataChanged: boolean = false;
  private nodeExpandState: { [key: string] : boolean } = {};
  private currentGeoVars: NodeVariable[] = [];
  private currentMapVar: NodeVariable = null;

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

  private buildVarNode(geoVar: NodeVariable) : TreeNode {
    const digitsInfo = `1.${geoVar.digitRounding}-${geoVar.digitRounding}`;
    return {
      data: {
        name: geoVar.name,
        value: geoVar.value,
        isNumber: geoVar.isNumber,
        digitsInfo: digitsInfo
      },
      leaf: true
    };
  }

  ngOnInit() {
    this.init();
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
    if (this.currentMapVar) {
      return this.buildVarNode(this.currentMapVar);
    }
    return null;
  }

  private getRootAttributeNodes() : TreeNode[] {
    const rootNameSet = new Set<string>(this.customPopupDefinition.popupFields);
    const rootAttributes = this.attributeFields.filter(f => rootNameSet.has(f.fieldName));
    return this.buildAttributeNodes(rootAttributes);
  }

  private getSelectedVariableTree() : TreeNode {
    if (this.currentGeoVars.length === 0) return null;
    return {
      data: {
        name: 'Selected Audiences',
        value: ''
      },
      leaf: false,
      expanded: false,
      children: this.currentGeoVars.map(v => this.buildVarNode(v))
    };
  }

  private getStandardVariableTree() : TreeNode {
    const standardNameSet = new Set<string>(this.customPopupDefinition.secondaryPopupFields);
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
