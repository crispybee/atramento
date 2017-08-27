import path = require('path');
import { Router, Request, Response } from 'express';


let UPLOAD_PATH: string = 'uploads';
let pageRouter: Router = Router();

// invoked for any requests passed to router
pageRouter.use((request, response, next) => {
	console.log('Page:', request.method, request.url);
	next();
});

pageRouter.get('/', function (request, response) {
	response.sendFile(__dirname + '/loader.html');
});

export const Page: Router = pageRouter;