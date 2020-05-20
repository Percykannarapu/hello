

export function isSymbolTableElement(l: __esri.LegendElement) : l is __esri.SymbolTableElement {
  return l != null && l.type === 'symbol-table';
}

export function isSymbolTableElementInfo(e: __esri.SymbolTableElementType) : e is __esri.SymbolTableElementInfo {
  return e != null && e.hasOwnProperty('symbol') && e['symbol'] != null;
}
