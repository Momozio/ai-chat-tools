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
  id?:string;
	role: string;
	content: string;
  createTime:string;
};

/** 提交的message type */
export type IchatMessage = {
  role: string;
	content: string; 
}