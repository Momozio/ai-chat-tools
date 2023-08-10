import {Ichat} from 'types/openai';
import {IchatHistory} from './../types/chatHistory';
import moment from 'moment';
import {v4 as uuidv4} from 'uuid';
export const useChatHistoryStore = defineStore('chatHistory', () => {
	/** 聊天历史 */
	const chatHistory = ref<IchatHistory[]>([]);
	/** 当前聊天id */
	const currentChatId = ref<string>('');

	/** 设置当前聊天id */
	const setCurrentChatId = (id: string) => {
		currentChatId.value = id;
		// 同步存入本地存储
		localStorage.setItem('currentChatId', currentChatId.value);
	};

	/** 设置聊天历史 */
	function setChatHistory(historyList: IchatHistory[]) {
		chatHistory.value = historyList;
		// 同步存入本地存储
		localStorage.setItem('chatHistory', JSON.stringify(historyList));
	}

	/** 新增一条聊天历史 */
	function pushChatHistory(history: IchatHistory) {
		chatHistory.value.unshift(history);
		// 同步存入本地存储
		localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value));
	}

	/** 设置聊天记录的 message */
	function setChatMessage(id: string, messages: Ichat[]) {
		chatHistory.value.forEach((chatHistoryItem) => {
			if (chatHistoryItem.id === id) {
				chatHistoryItem.messages = messages;
				return;
			}
		});
		// 同时存入本地存储
		localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value));
	}

	/** 根据id获取聊天信息 */
	function getChatHistoryById(id: string) {
		return chatHistory.value.find((item) => item.id === id);
	}

	/** 设置标题 */
	function setChatHistoryTitle(id: string, title: string) {
		const chatHistoryItem = getChatHistoryById(id);
		if (chatHistoryItem) {
			chatHistoryItem.title = title;
			localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value));
		}
	}

	/** 根据id删除记录 */
	function deleteChatHistory(id: string) {
		const currentIndex = chatHistory.value.findIndex((item) => item.id === id);
		chatHistory.value.splice(currentIndex, 1);
		// 还有剩下的对话
		if (chatHistory.value.length > 0) {
			setCurrentChatId(chatHistory.value[currentIndex].id);
		}
		// 如果空了
		else{
			const now = moment();
			const id = uuidv4();
			// 重新建一条空对话
			pushChatHistory({
				id,
				createTime: now.format('YYYY-MM-DD HH:mm:ss'),
				title: '',
				messages: [
					{
						id: uuidv4(),
						role: 'system',
						content: '我是你的ai助理, 有什么能帮到你的吗',
						createTime: now.format('YYYY-MM-DD HH:mm:ss'),
					},
				],
			});
			// 设置当前chat id
			setCurrentChatId(id);
		}
		localStorage.setItem('chatHistory', JSON.stringify(chatHistory.value));
	}

	return {
		setCurrentChatId,
		chatHistory,
		setChatHistory,
		pushChatHistory,
		currentChatId,
		getChatHistoryById,
		setChatMessage,
		setChatHistoryTitle,
		deleteChatHistory,
	};
});
