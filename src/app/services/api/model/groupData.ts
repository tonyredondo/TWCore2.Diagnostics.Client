import { KeyValue } from './keyValue';
import { NodeInfo } from "./nodeInfo";

export interface GroupData {
  environment?: string;
  group?: string;
  metadata?: Array<KeyValue>;
  data?: Array<NodeInfo>;
}
