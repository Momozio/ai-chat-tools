import { Ichat } from "./openai";

export type IchatHistory = {
  id:string,
  createTime:string,
  title:string,
  messages:Ichat[]
};
