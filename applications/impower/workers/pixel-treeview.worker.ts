import { requestPixelTreeNodes } from '../worker-shared/treeview-workers/online-treeview.state';
import { TreeviewPayload } from '../worker-shared/treeview-workers/payloads';

interface Payload { data: TreeviewPayload; }

addEventListener('message', async (payload: Payload) => {
  const response = await requestPixelTreeNodes(payload.data);
  postMessage(response);
});
