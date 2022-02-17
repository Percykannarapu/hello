import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { TreeNode } from 'primeng/api';

export interface PopupTreeNodeData {
  name: string;
  sortOrder: number;
  pk?: number;
  value?: string | number;
  isNumber?: boolean;
  numberFormat?: 'percent' | 'currency' | 'none';
  digitsInfo?: string;
  isMessageNode?: boolean;
}

@Component({
  selector: 'val-esri-geometry-popup',
  templateUrl: 'esri-geography-popup.component.html',
  styleUrls: ['./esri-geography-popup.component.scss'],
})
export class EsriGeographyPopupComponent implements OnInit {

  private readonly secondaryRootName = 'Standard Variables';
  private readonly audienceRootName = 'Selected Audiences';

  data: TreeNode<PopupTreeNodeData>[];

  @Input() geocode: string;
  @Input() primaryTreeNodes: TreeNode<PopupTreeNodeData>[] = [];
  @Input() secondaryTreeNodes: TreeNode<PopupTreeNodeData>[] = [];
  @Input() audienceTreeNodes: TreeNode<PopupTreeNodeData>[] = [];
  @Input() loadingPrimaryData: boolean = false;
  @Input() loadingAudienceData: boolean = false;

  @Output() needsRefresh = new EventEmitter<any>();

  public nodeExpandState: { [key: string] : boolean };

  public ngOnInit() : void {
    this.refreshTreeview();
  }

  onExpand(node: TreeNode<PopupTreeNodeData>) {
    this.nodeExpandState[node.data.name] = true;
    this.needsRefresh.emit(this.nodeExpandState);
  }

  onCollapse(node: TreeNode<PopupTreeNodeData>) {
    this.nodeExpandState[node.data.name] = false;
    this.needsRefresh.emit(this.nodeExpandState);
  }

  public refreshTreeview() {
    const result = Array.from(this.primaryTreeNodes);
    let sortNum = this.primaryTreeNodes.length;
    if (this.secondaryTreeNodes.length > 0) {
      result.push(this.createRootNode(this.secondaryRootName, this.secondaryTreeNodes, sortNum++));
    }
    if (this.audienceTreeNodes.length > 0) {
      result.push(this.createRootNode(this.audienceRootName, this.audienceTreeNodes, sortNum));
    }
    this.data = result;
  }

  private createRootNode(rootName: string, childNodes: TreeNode<PopupTreeNodeData>[], sortOrder: number) : TreeNode<PopupTreeNodeData> {
    return {
      data: {
        name: rootName,
        isMessageNode: true,
        sortOrder
      },
      leaf: false,
      expanded: this.nodeExpandState[rootName] ?? false,
      children: Array.from(childNodes)
    };
  }
}
