<template>
	<!-- chat item -->
	<div class="chat-item" :class="chatData.role">
		<!-- 头像 -->
		<div class="chat-avatar">
			<img v-if="chatData.role == 'system'" src="/images/chatgpt.png" alt="system" />
			<img v-if="chatData.role == 'user'" src="/images/user.png" alt="system" />
		</div>
		<!-- markdown 内容 -->
		<div class="markdown-body chat-content" v-html="getMarkdown(chatData.content)"></div>
	</div>
</template>

<script setup lang="ts">
import createMarkdownIt from 'markdown-it';
import 'highlight.js/styles/atom-one-dark.css';
import hljs from 'highlight.js';
import {Ichat} from 'types/openai';
/** props */
const props = defineProps<{
	chatData: Ichat;
}>();
/** 初始化markdown It */
const markdownIt: any = createMarkdownIt({
	typographer: true,
	xhtmlOut: true,
	linkify: true,
	// 高亮设置
	highlight: (code: string, lang: string) => {
		if (lang && hljs.getLanguage(lang)) {
			try {
				return (
					'<pre class="hljs cus-hljs"><code>' +
					hljs.highlight(lang, code, true).value +
					'</code></pre>'
				);
			} catch (__) {}
		}
		return (
			'<pre class="hljs cus-hljs"><code>' + markdownIt.utils.escapeHtml(code) + '</code></pre>'
		);
	},
});

/** 将文本经由markdownIt处理 */
const getMarkdown = (content: string): string => {
	return markdownIt.render(content);
};
</script>

<style lang="scss" scoped>
// chat item
.chat-item {
	display: flex;
	padding: 24px;

	// markdown内容
	.chat-content {
		flex: 1;
		background-color: transparent !important;
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
</style>
