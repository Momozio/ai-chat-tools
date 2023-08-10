import {defineStore} from 'pinia';
import {reactive, ref} from 'vue';
type IchatConfig = {
	model: string;
	stream: boolean;
	frequency_penalty: number;
	presence_penalty: number;
	temperature: number;
	top_p: number;
};
type IopenaiConfig = {
	key: string;
	apiUrl: string;
};
export const useChatConfigStore = defineStore('config', () => {
	const chatConfig = ref<IchatConfig>({
		model: 'gpt-3.5-turbo',
		stream: true,
		frequency_penalty: 0,
		presence_penalty: 0,
		temperature: 0.5,
		top_p: 1,
	});

	const openaiConfig = ref<IopenaiConfig>({
		key: '',
		apiUrl: '',
	});

	/** 设置chat config */
	function setChatConfig(config: IchatConfig) {
		chatConfig.value = config;
	}

	/** 设置 openaiConfig */
	function setOpenaiConfig(config:IopenaiConfig){
		openaiConfig.value = config;
		// 同步存入本地存储
		localStorage.setItem('openaiConfig', JSON.stringify(openaiConfig.value));
	}
	return {chatConfig, setChatConfig, openaiConfig, setOpenaiConfig};
});
