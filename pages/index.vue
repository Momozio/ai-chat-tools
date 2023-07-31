<template>
  <div class="ai-chat">
    <div class="chat-list-box">
      <!-- chat item -->
      <div
        class="chat-item"
        :class="chat.role"
        v-for="(chat, index) in chatList"
        :key="index"
      >
        <!-- 头像 -->
        <div class="chat-avatar">
          <img v-if="chat.role == 'system'" src="/images/chatgpt.png" alt="" />
          <img v-if="chat.role == 'user'" src="/images/user.png" alt="" />
        </div>
        <!-- markdown 内容 -->
        <div
          class="markdown-body chat-content"
          v-html="getMarkdown(chat.content)"
        ></div>
      </div>
    </div>
    <!-- 底部输入框 -->
    <div class="bottom-box">
      <el-input v-model="chatValue" />
      <el-button @click="submitChat" v-if="state == 'stop' || state == 'wait'"
        >提交</el-button
      >
      <el-button @click="endChat" v-if="state == 'loading'">暂停</el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ElMessage } from "element-plus";
import { onMounted, reactive, ref } from "vue";
import createMarkdownIt from "markdown-it";
import { fetchEventSource } from "@microsoft/fetch-event-source";
import hljs from "highlight.js";
import "github-markdown-css";
import "highlight.js/styles/atom-one-dark.css";
/** 聊天格式 type */
type Ichat = {
  role: string;
  content: string;
};
/** key */
const key: string = "4XgFUI0QooHS8Y_KnOWcT717J88bfhGuIZfqZ3KqT7E";
/** api url */
const apiUrl: string =
  "https://chimeragpt.adventblocks.cc/api/v1/chat/completions";

/** 初始化markdown It */
const markdownIt: any = createMarkdownIt({
  typographer: true,
  xhtmlOut: true,
  linkify: true,
  highlight: (code: string, lang: string) => {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return (
          '<pre class="hljs cus-hljs"><code>' +
          hljs.highlight(lang, code, true).value +
          "</code></pre>"
        );
      } catch (__) {}
    }
    return (
      '<pre class="hljs cus-hljs"><code>' +
      markdownIt.utils.escapeHtml(code) +
      "</code></pre>"
    );
  },
});

/** 将文本经由markdownIt处理 */
const getMarkdown = (content: string): string => {
  return markdownIt.render(content);
};

/** 运行状态 */
const state = ref<"loading" | "stop" | "wait">("wait");

/** 提交chat内容 */
const chatValue = ref<string>("使用python写一个生成随机数的函数");

/** 聊天列表 */
const chatList = reactive<Ichat[]>([
  { role: "system", content: "我是你的ai助理, 有什么能帮到你的吗" },
  { role: "user", content: "请在开头加上: '好的喵!', 知道了吗" },
  { role: "system", content: "好的喵" },
]);

/** 提交chat */
const submitChat = () => {
  const message = chatValue.value;
  if (message.trim() === "") {
    ElMessage.warning("请输入内容");
    return;
  }

  // 追加用户对话
  chatList.push({ role: "user", content: message });

  // 最近的一组对话
  let messages: Ichat[] = chatList.slice(-3);

  // 发送chat
  sendChat([...messages]);
  
  // 清空
  chatValue.value = "";
};

/** 暂停chat */
const endChat = () => {
  state.value = "stop";
};

/** 发送chat */
const sendChat = async (messages: Ichat[]) => {
  state.value = "loading";
  const ctrl = new AbortController();
  fetchEventSource(apiUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${key}`,
    },
    body: JSON.stringify({
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
      frequency_penalty: 0,
      presence_penalty: 0,
      temperature: 0.5,
      top_p: 1,
    }),
    signal: ctrl.signal,
    async onopen() {
      chatList.push({ role: "system", content: "" });
    },
    onmessage(ev) {
      // 返回内容
      const dataJson = JSON.parse(ev.data);
      const content = dataJson.choices[0].delta.content;

      // 校验
      if (
        state.value === "stop" ||
        dataJson.finish_reason ||
        content == undefined
      ) {
        state.value = "stop";
        ctrl.abort();
      } else {
        // 追加
        chatList[chatList.length - 1].content += content;
      }
    },
    onclose() {
      state.value = "stop";
    },
    onerror(err) {
      ElMessage.error(err);
      state.value = "stop";
      // 最后一条重新设置
      chatList[chatList.length - 1].content = "network error";
    },
  });
};

onMounted(() => {
  //   sendChat();
});
</script>

<style lang="scss" scoped>
.ai-chat {
  max-width: 1000px;
  margin: 0 auto;

  // chat 列表
  .chat-list-box {
    // chat item
    .chat-item {
      display: flex;
      padding: 24px;

      // markdown内容
      .chat-content {
        flex: 1;
        background-color: transparent !important;
        .markdown-body .highlight pre,
        .markdown-body pre {
          color: #abb2bf !important;
          background-color: #282c34 !important;
        }
      }
      // 头像
      .chat-avatar {
        margin-right: 32px;
        width: 30px;
        height: 30px;
        box-sizing: border-box;
        border-radius: 8px;
        padding: 6px;
        img {
          width: 100%;
          height: 100%;
        }
      }
      // 头像 系统
      &.system {
        background-color: #f7f7f8;
        .chat-avatar {
          background-color: #19c37d;
        }
      }
      // 头像 用户
      &.user {
        .chat-avatar {
          background-color: #9a59b5;
        }
      }
    }
  }

  // 底部内容
  .bottom-box {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 10px;
    border-top: 1px solid #e5e5e5;
  }
}
</style>