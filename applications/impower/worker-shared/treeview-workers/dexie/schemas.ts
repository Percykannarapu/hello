import Dexie from 'dexie';

export class TDASchema extends Dexie {
  constructor() {
    super('TDAAudiences');
    this.version(1).stores({
      refresh: '++id, timestamp',
      categories: 'pk',
      audiences: 'pk, parentPk, *searchTags, *folderSearchTags'
    });
  }
}

export class InterestSchema extends Dexie {
  constructor() {
    super('InterestAudiences');
    this.version(1).stores({
      refresh: '++id, timestamp',
      audiences: 'digCategoryId, parentId, *searchTags, *folderSearchTags'
    });
  }
}

export class InMarketSchema extends Dexie {
  constructor() {
    super('InMarketAudiences');
    this.version(1).stores({
      refresh: '++id, timestamp',
      audiences: 'digCategoryId, parentId, *searchTags, *folderSearchTags'
    });
  }
}

export class VLHSchema extends Dexie {
  constructor() {
    super('VLHAudiences');
    this.version(1).stores({
      refresh: '++id, timestamp',
      audiences: 'digCategoryId, parentId, *searchTags, *folderSearchTags'
    });
  }
}

export class PixelSchema extends Dexie {
  constructor() {
    super('PixelAudiences');
    this.version(1).stores({
      refresh: '++id, timestamp',
      audiences: 'digCategoryId, parentId, *searchTags, *folderSearchTags'
    });
  }
}
