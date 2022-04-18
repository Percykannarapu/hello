interface BaseFocalEvent {
  target: __esri.MapView;
  native: KeyboardEvent;
}
export type MapViewFocusEvent = BaseFocalEvent;
export type MapViewBlurEvent = BaseFocalEvent;

export interface MapViewResizeEvent {
  oldWidth: number;
  oldHeight: number;
  width: number;
  height: number;
}

interface BaseLayerViewEvent {
  layer: __esri.Layer;
}

interface BaseLayerViewCompleteEvent extends BaseLayerViewEvent {
  layerView: __esri.LayerView;
}

export type MapViewLayerViewCreateEvent = BaseLayerViewCompleteEvent;
export type MapViewLayerViewDestroyEvent = BaseLayerViewCompleteEvent;

export interface MapViewLayerViewCreateErrorEvent extends BaseLayerViewEvent {
  error: __esri.Error;
}

interface BaseMouseEvent<T extends PointerEvent | MouseEvent | WheelEvent> {
  x: number;
  y: number;
  button: 0 | 1 | 2;
  buttons: number;
  stopPropagation: Function;
  timestamp: number;
  native: T;
}

export interface MapViewDragEvent extends BaseMouseEvent<MouseEvent> {
  action: 'start' | 'added' | 'update' | 'removed' | 'end';
  origin: {
    x: number;
    y: number;
  };
  type: 'drag';
  radius: number;
  angle: number;
}

export interface MapViewMouseWheelEvent extends BaseMouseEvent<WheelEvent> {
  deltaY: number;
  type: 'mouse-wheel';
}

interface BaseClickEvent extends BaseMouseEvent<PointerEvent> {
  mapPoint: __esri.Point;
}

export interface MapViewClickEvent extends BaseClickEvent {
  type: 'click';
}

export interface MapViewDoubleClickEvent extends BaseClickEvent {
  type: 'double-click';
}

export interface MapViewImmediateClickEvent extends BaseClickEvent {
  type: 'immediate-click';
}

export interface MapViewImmediateDoubleClickEvent extends BaseClickEvent {
  type: 'immediate-double-click';
}

export interface MapViewHoldEvent extends BaseClickEvent {
  type: 'hold';
}

interface BasePointerEvent extends BaseMouseEvent<PointerEvent> {
  pointerId: number;
  pointerType: 'mouse' | 'touch';
}

export interface MapViewPointerDownEvent extends BasePointerEvent {
  type: 'pointer-down';
}

export interface MapViewPointerEnterEvent extends BasePointerEvent {
  type: 'pointer-enter';
}

export interface MapViewPointerLeaveEvent extends BasePointerEvent {
  type: 'pointer-leave';
}

export interface MapViewPointerMoveEvent extends BasePointerEvent {
  type: 'pointer-move';
}

export interface MapViewPointerUpEvent extends BasePointerEvent {
  type: 'pointer-up';
}

interface BaseKeyboardEvent {
  key: string;
  stopPropagation: Function;
  timestamp: number;
  native: KeyboardEvent;
}

export interface MapViewKeyDownEvent extends BaseKeyboardEvent {
  type: 'key-down';
  repeat: boolean;
}

export interface MapViewKeyUpEvent extends BaseKeyboardEvent {
  type: 'key-up';
}
