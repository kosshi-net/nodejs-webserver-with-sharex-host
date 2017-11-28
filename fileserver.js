'use strict';
const http = require("http");
const https = require("https");
const fs = require("fs");
const mime = require('mime');
class FileServer {
	constructor(){
		this.http = {};
		this.https = {};
		this.handlers = [];
	}

	openHTTP(port){
		this.http = http.createServer(this.handleRequest.bind(this));
		this.http.listen(port, ()=>{
			console.log(`HTTP listening on ${port}`);
		});
	}

	openHTTPS(port, crypto){
		let files = {
			key: fs.readFileSync(crypto.dir_key),
			cert: fs.readFileSync(crypto.dir_cert),
			ca: fs.readFileSync(crypto.dir_ca)
		};
		this.https = https.createServer(files, this.handleRequest.bind(this));
		this.https.listen(port, ()=>{
			console.log(`HTTP listening on ${port}`);
		});
	}

	setHandler(url, callback){
		this.handlers[url] = callback;
	}

	clearHandler(url){
		delete this.handlers[url];
	}

	handleRequest(request, response){
		var IP = request.connection.remoteAddress;

		var date = new Date();
		var t_h = ('0' + date.getHours()).slice(-2);
		var t_m = ('0' + date.getMinutes()).slice(-2);
		var t_s = ('0' + date.getSeconds()).slice(-2);
		var timestamp = "["+t_h+"."+t_m+"."+t_s+"]";

		if(this.handlers[request.url.split('?')[0]]){
			this.handlers[request.url.split('?')[0]](request, response);
			console.log(`${timestamp} ${IP} URL ${request.url}`);
			return;
		}

		var dir = "./www" + request.url.split('?')[0];
		var code = 200;

		fs.access(dir, fs.F_OK, accessCallback_1);
		function accessCallback_1(err){
			if(err){
				dir = "./err/404.html"; 
				code = 404;
			}
			fs.stat(dir, statCallback_1);
		}

		function statCallback_1(err,stats){
			if(stats.isDirectory()){
				if( dir[dir.length-1] != "/" ){
					response.writeHead(302, { 
						'Content-Type': 'text/plain',
						'Location': (request.url.split('?')[0])+="/"
					});
					response.end("Redirecting...", 'utf-8');
					return;
				}
				dir += "index.html";
			}
			fs.access(dir, fs.F_OK, accessCallback_2);
		}

		var contentType;
		function accessCallback_2(err){
			if(err){
				dir = "./err/404.html"; 
				code = 404;
			}
			contentType = mime.lookup(dir);
			fs.readFile(dir, readFileCallback_1);
		}

		function readFileCallback_1(error, content) {
			if (error) throw "Error while reading file " +  dir;
			response.writeHead(code, { 'Content-Type': contentType });
			response.end(content, 'utf-8');

			console.log(`${timestamp} ${IP} ${code} ${request.url}`);

			return;
		}
	}
}

module.exports = FileServer;