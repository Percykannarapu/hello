import { createReducer, on } from '@ngrx/store';
import { arrayToSet, getUuid, isEmpty } from '@val/common';
import { MessageCenterData } from '../messaging.interfaces';
import * as MessageCenterActions from './message-center.actions';
import { isErrorNotification, NotificationProps } from './message-center.actions';

export interface MessageCenterState {
  messageQueue: MessageCenterData[];
}

export const initialState: MessageCenterState = {
  messageQueue: []
};

function addMessageToQueue<T extends NotificationProps>(props: T, severity: MessageCenterData['severity'], state: MessageCenterState) : MessageCenterState {
  const dataObject = createDataObject(props, severity);
  return {
    ...state,
    messageQueue: state.messageQueue.concat([dataObject])
  };
}

function createDataObject<T extends NotificationProps>(props: T, severity: MessageCenterData['severity']) : MessageCenterData {
  const result: MessageCenterData = {
    id: getUuid(),
    timeStamp: new Date(),
    severity,
    title: props.notificationTitle,
    message: props.message,
  };
  if (isErrorNotification(props)) result.otherData = props.additionalErrorInfo;
  return result;
}

export const messageCenterReducer = createReducer(
  initialState,
  on(MessageCenterActions.ErrorNotification, (state, action) => addMessageToQueue(action, 'error', state)),
  on(MessageCenterActions.WarningNotification, (state, action) => addMessageToQueue(action, 'warn', state)),
  on(MessageCenterActions.InfoNotification, (state, action) => addMessageToQueue(action, 'info', state)),
  on(MessageCenterActions.SuccessNotification, (state, action) => addMessageToQueue(action, 'success', state)),
  on(MessageCenterActions.ClearNotifications, (state, action) => {
    if (isEmpty(action.ids)) {
      return {
        ...state,
        messageQueue: initialState.messageQueue
      };
    } else {
      const idsForRemoval = arrayToSet(action.ids);
      return {
        ...state,
        messageQueue: state.messageQueue.filter(m => !idsForRemoval.has(m.id))
      };
    }
  })
);
