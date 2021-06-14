import { FieldContentTypeCodes } from '../../worker-shared/data-model/impower.data-model.enums';
import {
  isOfflineCategory,
  OfflineResponse,
  OnlineAudienceDefinition
} from '../impower-datastore/state/transient/audience-definitions/audience-definitions.model';

export class OnlineAudienceDescription {
  private childMap: Map<string | number, OnlineAudienceDescription> = new Map<string | number, OnlineAudienceDescription>();
  isLeaf: boolean;
  categoryId: number;
  digLookup: Map<string, number> = new Map<string, number>();
  categoryName: string;
  taxonomyParsedName: string;
  categoryDescription: string;
  taxonomy: string;
  fieldconte: FieldContentTypeCodes;

  get children() : OnlineAudienceDescription[] {
    return Array.from(this.childMap.values());
  }

  constructor(categories?: OnlineAudienceDefinition[]) {
    if (categories != null) {
      for (const category of categories) {
        let pathItems: string[] = [];
        if (category.categoryName.includes('/') && category.taxonomy.endsWith(category.categoryName)) {
          const currentTaxonomy = category.taxonomy.replace(category.categoryName, '');
          pathItems = currentTaxonomy.split('/').filter(s => s != null && s.length > 0);
          pathItems.push(category.categoryName);
        } else {
          pathItems = category.taxonomy.split('/').filter(s => s != null && s.length > 0);
        }
        this.createSubTree(pathItems, category);
      }
    }
  }

  hasSource(sourceName: string) : boolean {
    return this.digLookup.has(sourceName);
  }

  createSubTree(treeItems: string[], response: OnlineAudienceDefinition) {
    const currentCategory = treeItems.shift();
    const child = new OnlineAudienceDescription();
    child.taxonomyParsedName = currentCategory;
    if (treeItems.length === 0) {
      // we're at the bottom of the taxonomy chain
      if (this.childMap.has(response.categoryId)) {
        // this category has already been added once - just need to append the source
        const localCategory = this.childMap.get(response.categoryId);
        localCategory.digLookup.set(response.source, Number(response.digCategoryId));
      } else {
        child.isLeaf = true;
        child.categoryId = Number(response.categoryId);
        child.digLookup.set(response.source, Number(response.digCategoryId));
        child.categoryDescription = response.categoryDescr;
        child.categoryName = response.categoryName;
        child.taxonomy = response.taxonomy;
        this.childMap.set(response.categoryId, child);
      }
    } else {
      // we're still at a folder level of the taxonomy
      if (!this.childMap.has(currentCategory)) {
        // if the folder doesn't exist, create it as a child
        child.isLeaf = false;
        this.childMap.set(currentCategory, child);
      }
      this.childMap.get(currentCategory).createSubTree(treeItems, response);
    }
  }
}

export class OfflineAudienceDefinition {
  identifier: string;
  displayName: string;
  fieldconte: FieldContentTypeCodes;
  additionalSearchField: string;
  sortOrder: number;
  parentName: string;
  children: OfflineAudienceDefinition[];
  constructor(response: OfflineResponse) {
    if (isOfflineCategory(response)) {
      this.displayName = response.tabledesc;
      this.identifier = response.tablename;
      this.sortOrder = response.sort;
      this.fieldconte = FieldContentTypeCodes.Char;
      this.children = [];
    } else {
      this.displayName = response.fielddescr;
      this.identifier = response.pk;
      this.fieldconte = FieldContentTypeCodes.parse(response.fieldconte);
      this.additionalSearchField = response.fieldname;
      this.parentName = response.tablename;
      this.sortOrder = 0;
    }
  }
}
