export enum LabelLinePlacement {
  AboveAfter = 'esriServerLinePlacementAboveAfter',
  AboveAlong = 'esriServerLinePlacementAboveAlong',
  AboveBefore = 'esriServerLinePlacementAboveBefore',
  AboveEnd = 'esriServerLinePlacementAboveEnd',
  AboveStart = 'esriServerLinePlacementAboveStart',
  BelowAfter = 'esriServerLinePlacementBelowAfter',
  BelowAlong = 'esriServerLinePlacementBelowAlong',
  BelowBefore = 'esriServerLinePlacementBelowBefore',
  BelowEnd = 'esriServerLinePlacementBelowEnd',
  BelowStart = 'esriServerLinePlacementBelowStart',
  CenterAfter = 'esriServerLinePlacementCenterAfter',
  CenterAlong = 'esriServerLinePlacementCenterAlong',
  CenterBefore = 'esriServerLinePlacementCenterBefore',
  CenterEnd = 'esriServerLinePlacementCenterEnd',
  CenterStart = 'esriServerLinePlacementCenterStart',
}

export enum LabelPointPlacement {
  AboveCenter = 'esriServerPointLabelPlacementAboveCenter',
  AboveLeft = 'esriServerPointLabelPlacementAboveLeft',
  AboveRight = 'esriServerPointLabelPlacementAboveRight',
  BelowCenter = 'esriServerPointLabelPlacementBelowCenter',
  BelowLeft = 'esriServerPointLabelPlacementBelowLeft',
  BelowRight = 'esriServerPointLabelPlacementBelowRight',
  CenterCenter = 'esriServerPointLabelPlacementCenterCenter',
  CenterLeft = 'esriServerPointLabelPlacementCenterLeft',
  CenterRight = 'esriServerPointLabelPlacementCenterRight',
}

export enum LabelPolygonPlacement {
  AlwaysHorizontal = 'esriServerPolygonPlacementAlwaysHorizontal',
}

export enum LabelMultiPartHandling {
  Largest = 'labelLargest',
  PerFeature = 'labelPerFeature',
  PerPart = 'labelPerPart',
  PerSegment = 'labelPerSegment',
}

export enum LabelDuplicateRemoval {
  All = 'all',
  FeatureType = 'featureType',
  LabelClass = 'labelClass',
  None = 'none'
}

export enum HorizontalAlignment {
  Center = 'center',
  Justify = 'justify',
  Left = 'left',
  Right = 'right',
}

export enum VerticalAlignment {
  Baseline = 'baseline',
  Bottom = 'bottom',
  Middle = 'middle',
  Top = 'top',
}

export enum FontDecoration {
  LineThrough = 'line-through',
  None = 'none',
  Underline = 'underline'
}

export enum FontStyle {
  Italic = 'italic',
  Normal = 'normal',
  Oblique = 'oblique'
}

export enum FontWeight {
  Bold = 'bold',
  Bolder = 'bolder',
  Lighter = 'lighter',
  Normal = 'normal'
}

export enum SimpleFillType {
  BackwardDiagonal = 'esriSFSBackwardDiagonal',
  Cross = 'esriSFSCross',
  DiagonalCross = 'esriSFSDiagonalCross',
  ForwardDiagonal = 'esriSFSForwardDiagonal',
  Horizontal = 'esriSFSHorizontal',
  Null = 'esriSFSNull',
  Solid = 'esriSFSSolid',
  Vertical = 'esriSFSVertical',
}

export enum SimpleLineType {
  Dash = 'esriSLSDash',
  DashDot = 'esriSLSDashDot',
  DashDotDot = 'esriSLSDashDotDot',
  Dot = 'esriSLSDot',
  LongDash = 'esriSLSLongDash',
  LongDashDot = 'esriSLSLongDashDot',
  Null = 'esriSLSNull',
  ShortDash = 'esriSLSShortDash',
  ShortDashDot = 'esriSLSShortDashDot',
  ShortDashDotDot = 'esriSLSShortDashDotDot',
  ShortDot = 'esriSLSShortDot',
  Solid = 'esriSLSSolid',
}

export enum MarkerPlacement {
  Begin = 'begin',
  BeginEnd = 'begin-end',
  End = 'end'
}

export enum SimpleMarkerType {
  Circle = 'esriSMSCircle',
  Cross = 'esriSMSCross',
  Diamond = 'esriSMSDiamond',
  Square = 'esriSMSSquare',
  Triangle = 'esriSMSTriangle',
  X = 'esriSMSX',
}
