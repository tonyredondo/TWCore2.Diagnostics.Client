export interface GroupResult {
  group?: string;
  logsCount?: number;
  tracesCount?: number;
  start?: Date;
  end?: Date;
  hasErrors?: boolean;
}
