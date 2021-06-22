import { requestTreeNodes } from '../worker-shared/treeview-workers/offline-treeview.state';
import { TreeviewPayload } from '../worker-shared/treeview-workers/payloads';

interface Payload { data: TreeviewPayload; }

addEventListener('message', async (payload: Payload) => {
  const response = await requestTreeNodes(payload.data);
  postMessage(response);
});
