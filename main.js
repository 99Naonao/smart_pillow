import App from './App'

// #ifndef VUE3
import Vue from 'vue'
import './uni.promisify.adaptor'
// #endif

// #ifdef VUE3
import {
	createSSRApp
} from 'vue'
// import zhouWeiNavBar from "@/components/z-nav-bar";
export function createApp() {
	const app = createSSRApp(App)
	// app.component("z-nav-bar", zhouWeiNavBar);
	return {
		app
	}
}
// #endif