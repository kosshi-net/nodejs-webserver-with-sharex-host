'use strict';

const fs = require('fs');
const formidable = require('formidable');

class Plugin{
	constructor(main){
		this.main = main;

	}

	get name() {
		return 'Sharex';
	}

	start(){

		this.main.server.setHandler('/u/upload', (request, response)=>{

			let randomBase64 = function (length){
				var name = '';
				while(length--)
					name += 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789_-'[ (Math.random()*64|0) ];
				return name;
			};

			if ( request.method.toLowerCase() != 'post') {
				response.writeHead(405); response.end();
				return;
			}

			var content = {
				success: false,
				code: 500
			};

			if (request.headers.key != this.main.sharexkey){
				content.code = 403;
				content.description = 'Invalid key';
				respond();
				return;
			}

			var form = new formidable.IncomingForm();
			form.uploadDir = './www/u/';
			form.keepExtensions = true;
			form.parse(request, formidableCallback);
			form.maxFields = 5;

			function formidableCallback(err, fields, files) {
				if(err){
					content.description = 'Server error';
					console.log(err);
					respond();
					return;
				}
				var file = files.file;
				if (!file || !file.size){
					content.code = 400;
					content.description = 'Invalid or no input file';
					respond();
				}
				content.filename = randomBase64(4);
				content.filename += '.' + file.name.split('.').last();
				fs.rename(file.path,'./www/u/'+content.filename, renameCallback);
			}

			function renameCallback(err){
				if(err){
					content.description = 'Server error';
					console.log(err);
					respond();
					return;
				}
				content.code = 200;
				content.success = true;
				content.url = '/u/'+content.filename;
				respond();
			}

			function respond(){
				console.log('File', content);
				response.writeHead(content.code, {'content-type': 'text/plain'});
				response.end(JSON.stringify(content),'utf-8');
				return;
			}

		});
	}

	stop(){
		this.main.server.clearHandler('/u/upload');
	}

}

module.exports = Plugin;
