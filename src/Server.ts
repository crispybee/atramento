import * as express from 'express';

import { Express, Request, Response, Router } from 'express';

import { Page } from './routes/Page';
import { Rest } from './routes/Rest';
import { RejectPromise, ResolveVoidPromise } from './Utils';

export class Server {
	public UPLOAD_PATH: string = 'uploads';
	public port: string = process.env.PORT || '3000';
	public router: Router;
	public app: Express;
	private readonly logPrefix: string = 'Server:';

	constructor(port?: string, UPLOAD_PATH?: string) {
		if (port) {
			this.port = port;
		}

		if (UPLOAD_PATH) {
			this.UPLOAD_PATH = UPLOAD_PATH;
		}

		this.applyRouters();
	}

	public start(): Promise<void> {
		return new Promise<void>((resolve: ResolveVoidPromise, reject: RejectPromise): void => {
			this.app.listen(this.port, (running: Function) => {
				console.log(this.logPrefix, 'Listening on port', this.port);
				resolve();
			});
		});
	}

	private applyRouters(): void {
		this.app = express();

		// invoked for any requests
		/*
		this.app.use((request, response, next) => {
			console.log(this.logPrefix, 'Request:', request.method, request.url);
			next();
		});
		*/

		this.app.use('/', Page);
		this.app.use('/rest', Rest);
	}
}
