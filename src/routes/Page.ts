import { Request, Response, Router } from 'express';
import { NextFunction } from 'express-serve-static-core';
import * as path from 'path';

const UPLOAD_PATH: string = 'uploads';
const pageRouter: Router = Router();

// invoked for any requests passed to router
pageRouter.use((request: Request, response: Response, next: NextFunction) => {
	console.log('Page:', request.method, request.url);
	next();
});

pageRouter.get('/', (request: Request, response: Response) => {
	response.sendFile(path.join(__dirname, 'loader.html'));
});

export const Page: Router = pageRouter;
