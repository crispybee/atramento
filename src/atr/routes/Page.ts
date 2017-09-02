import { Request, Response, Router } from 'express';
import { NextFunction } from 'express-serve-static-core';
import * as path from 'path';
import { PropertiesManager } from '../workers/PropertiesManager';

const propertiesManager: PropertiesManager = PropertiesManager.getInstance();
const pageRouter: Router = Router();

// invoked for any requests passed to router
pageRouter.use((request: Request, response: Response, next: NextFunction) => {
	console.log('Page:', request.method, request.url);
	next();
});

pageRouter.get('/', (request: Request, response: Response) => {
	response.sendFile(path.join(propertiesManager.ROOT_PATH, 'atr', 'pages', 'loader.html'));
});

export const Page: Router = pageRouter;
