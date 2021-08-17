import { Component, EventEmitter, Input, OnInit, Output, ViewEncapsulation } from '@angular/core';
import { isConvertibleToNumber } from '@val/common';
import { TreeNode } from 'primeng/api';
import { PopupDefinition } from '../../models/boundary-configuration';

export interface NodeVariable {
  digitRounding: number;
  name: string;
  value: any;
  isNumber: boolean;
  isMessageNode?: boolean;
}

interface AttributeField {
  fieldName: string;
  label?: string;
  visible?: boolean;
}

function attributeToTreeNode(attribute: AttributeField, value: any, isChild: boolean) : TreeNode {
  return {
    data: {
      name: attribute.label,
      value: value,
      isNumber: isConvertibleToNumber(value),
      digitsInfo: '1.0-2',
      isChild
    },
    leaf: true
  };
}

function varToTreeNode(variable: NodeVariable) : TreeNode {
  const digitsInfo = `1.${variable.digitRounding}-${variable.digitRounding}`;
  return {
    data: {
      name: variable.name,
      value: variable.value,
      isNumber: variable.isNumber,
      digitsInfo: digitsInfo,
      isMessageNode: variable.isMessageNode,
      isChild: true
    },
    leaf: true
  };
}

@Component({
  selector: 'val-esri-geometry-popup',
  templateUrl: 'esri-geography-popup.component.html',
  styleUrls: ['./esri-geography-popup.component.scss'],
  encapsulation: ViewEncapsulation.None
})
export class EsriGeographyPopupComponent implements OnInit {

  data: TreeNode[];

  @Input() geocode: string;
  @Input() selectedVars: NodeVariable[];
  @Input() attributes: { [key: string] : any };
  @Input() attributeFields: AttributeField[];
  @Input() customPopupDefinition: PopupDefinition;

  @Output() needsRefresh = new EventEmitter<any>();

  public nodeExpandState: { [key: string] : boolean };

  public ngOnInit() : void {
    this.refreshTreeview();
  }

  onExpand(node: TreeNode) {
    this.nodeExpandState[node.data.name] = true;
    this.needsRefresh.emit(this.nodeExpandState);
  }

  onCollapse(node: TreeNode) {
    this.nodeExpandState[node.data.name] = false;
    this.needsRefresh.emit(this.nodeExpandState);
  }

  public refreshTreeview() {
    this.data = this.getDataTree();
  }

  private getDataTree() : TreeNode[] {
    const result: TreeNode[] = this.getRootAttributeNodes();
    result.push(this.getSelectedVariableTree());
    result.push(this.getStandardVariableTree());
    return result.filter(node => node != null);
  }

  private getRootAttributeNodes() : TreeNode[] {
    const rootNameSet = new Set<string>(this.customPopupDefinition.popupFields);
    const rootAttributes = this.attributeFields.filter(f => rootNameSet.has(f.fieldName));
    return rootAttributes.map(attr => attributeToTreeNode(attr, this.attributes[attr.fieldName], false));
  }

  private getSelectedVariableTree() : TreeNode {
    if (this.selectedVars.length === 0) return null;
    return {
      data: {
        name: 'Selected Audiences',
        isMessageNode: true,
        isToggle: true
      },
      leaf: false,
      expanded: this.nodeExpandState['Selected Audiences'] ?? false,
      children: this.selectedVars.map(v => varToTreeNode(v))
    };
  }

  private getStandardVariableTree() : TreeNode {
    const standardNameSet = new Set<string>(this.customPopupDefinition.secondaryPopupFields);
    const standardAttributes = this.attributeFields.filter(f => standardNameSet.has(f.fieldName));
    return {
      data: {
        name: 'Standard Variables',
        isMessageNode: true,
        isToggle: true
      },
      leaf: false,
      expanded: this.nodeExpandState['Standard Variables'] ?? true,
      children: standardAttributes.map(attr => attributeToTreeNode(attr, this.attributes[attr.fieldName], true))
    };
  }
}
