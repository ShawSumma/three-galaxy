import './global.css';
import 'xterm/css/xterm.css';

import App from './App.svelte';

const app = new App({
	target: document.body,
	props: {}
});

export default app;