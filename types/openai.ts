/** chat返回result type */
export interface IchatResult {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Choice[];
}

interface Choice {
  index: number;
  delta: Delta;
  finish_reason?: any;
}

interface Delta {
  content?: string;
}

/** 聊天格式 type */
export type Ichat = {
	role: string;
	content: string;
};