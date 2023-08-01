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
export const useChatConfigStore = defineStore('counter', () => {
	const chatConfig = ref<IchatConfig>({
		model: 'gpt-3.5-turbo',
		stream: true,
		frequency_penalty: 0,
		presence_penalty: 0,
		temperature: 0.5,
		top_p: 1,
	});
	function setChatConfig(config: IchatConfig) {
		chatConfig.value = config;
	}

	return {chatConfig, setChatConfig};
});
