<template>
	<div class="chat-item-wrap" :class="chatData.role">
		<!-- chat item -->
		<div class="chat-item">
			<!-- 头像 -->
			<div class="chat-avatar">
				<img v-if="chatData.role == 'system'" src="/images/chatgpt.png" alt="system" />
				<img v-if="chatData.role == 'user'" src="/images/user.png" alt="system" />
			</div>
			<!-- markdown 内容 -->
			<div class="markdown-body chat-content" v-html="getMarkdown(chatData.content)"></div>
		</div>
		<!-- 日期时间 -->
		<div class="date-str">{{ chatData.createTime }}</div>
		<!-- 操作按钮组 -->
		<div class="btn-group">
			<el-tooltip
				v-if="state == 'loading' && chatData.role != 'user'"
				:hide-after="0"
				:show-after="200"
				effect="dark"
				content="暂停"
				placement="bottom"
			>
				<button @click="emit('endChat')"><i class="icon-square iconfont"></i></button>
			</el-tooltip>
			<el-tooltip
				v-if="state != 'loading' && chatData.role != 'user'"
				:hide-after="0"
				:show-after="200"
				effect="dark"
				content="重新生成"
				placement="bottom"
			>
				<button @click="emit('rebuildChat', chatData.id)">
					<i class="icon-reload iconfont"></i>
				</button>
			</el-tooltip>
			<el-tooltip :hide-after="0" :show-after="200" effect="dark" content="复制" placement="bottom">
				<button @click="copyToClipboard"><i class="icon-copy iconfont"></i></button>
			</el-tooltip>
			<el-tooltip
				v-if="state != 'loading'"
				:hide-after="0"
				:show-after="200"
				effect="dark"
				content="删除"
				placement="bottom"
			>
				<button @click="emit('deleteChatItem', chatData.id)">
					<i class="icon-delete iconfont"></i>
				</button>
			</el-tooltip>
		</div>
	</div>
</template>

<script setup lang="ts">
import createMarkdownIt from 'markdown-it';
import 'highlight.js/styles/atom-one-dark.css';
import hljs from 'highlight.js';
import {Ichat} from 'types/openai';
import copy from 'copy-to-clipboard';
/** props */
const props = defineProps<{
	chatData: Ichat;
	state: 'loading' | 'stop' | 'wait';
}>();
/** emit */
const emit = defineEmits(['rebuildChat', 'endChat', 'deleteChatItem']);
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

/** 复制内容到剪贴板 */
const copyToClipboard = () => {
	copy(props.chatData.content);
	ElMessage.info('复制成功');
};
</script>

<style lang="scss" scoped>
.chat-item-wrap {
	position: relative;
	padding: 24px;
	// 日期
	.date-str {
		position: absolute;
		right: 6px;
		bottom: 6px;
		font-size: 12px;
		color: #bbb;
	}
	.chat-item {
		display: flex;

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

	&:hover {
		.btn-group {
			height: auto;
			margin-top: 12px;
		}
	}

	.btn-group {
		margin-top: 0;
		padding-left: 62px;
		align-items: center;
		display: flex;
		height: 0;
		overflow: hidden;
		transition: all 0.1s ease;
		button {
			border: none;
			background-color: transparent;
			padding: 4px 8px;
			border-radius: 4px;
			&:hover {
				background: var(--el-color-primary-light-8);
				border: var(--el-border-color-hover);
				transition: all 0.1s ease;
			}
			i {
				font-size: 14px;
				line-height: 18px;
			}
		}
	}
}
// chat item
</style>
