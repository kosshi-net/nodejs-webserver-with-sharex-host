'use strict';
const fs = require('fs');
const FileServer = require('./fileserver.js');

class Core{
	constructor(){
		this.server = new FileServer();
		this.config = JSON.parse(fs.readFileSync('./config.json'));

		if(this.config.http_enable)
			this.server.openHTTP(this.config.http_port);
		
		if(this.config.https_enable)
			this.server.openHTTPS(this.config.https_port, this.config);
		
		this.plugins = {};

		this.loadPlugins();
	}
		
	loadPlugins(){
		let folder = fs.readdirSync('./plugins');
		console.log('Loading plugins...');
		for(let file in folder){
			file = folder[file];
			let plugin = require('./plugins/'+file);
			plugin = new plugin(this);
			if(!plugin.name) continue;
			this.plugins[plugin.name] = plugin;
			plugin.start();
			console.log('Loaded ./plugins/'+file+' ('+plugin.name+')');
		}	
	}


	redirect(request, response, url){
		response.writeHead(302, { 
			'Content-Type': 'text/plain',
			'Location': url
		});
		response.end("Redirecting...", 'utf-8');
	}
}

let core = new Core();
