import { NodeLogItem } from './nodeLogItem';
import { SerializableException } from './serializableException';

export interface NodeInfo {
  logId?: string;
  assembly?: string;
  type?: string;
  group?: string;
  code?: string;
  level?: NodeLogItem.LevelEnum;
  message?: string;
  exception?: SerializableException;
  timestamp?: Date;
  instanceId?: string;
  id?: string;
  environment?: string;
  machine?: string;
  application?: string;
  traceId?: string;
  tags?: string;
  name?: string;
  formats?: string[];
}
