import express = require('express');

import { Express, Router, Request, Response } from 'express';

import { Rest } from './routes/Rest';
import { Page } from './routes/Page';

export class Server {
	UPLOAD_PATH: string = 'uploads';
	port: string = process.env.PORT || '3000';
	router: Router;
	app: Express;

	constructor(port?: string, UPLOAD_PATH?: string) {
		if(port) {
			this.port = port;
		}

		if(UPLOAD_PATH) {
			this.UPLOAD_PATH = UPLOAD_PATH;
		}

		this.applyRouters();

		this.app.listen(this.port);
		console.log('Listening on port', this.port);
	}

	applyRouters(): void {
		this.app = express();

		// invoked for any requests
		/*
		this.app.use((request, response, next) => {
			console.log('Request:', request.method, request.url);
			next();
		});
		*/

		this.app.use('/', Page);
		this.app.use('/rest', Rest);
	}
}