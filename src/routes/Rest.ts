import * as bodyParser from 'body-parser';
import { Request, Response, Router } from 'express';
import * as multer from 'multer';
import * as path from 'path';
import { MulterStorageFilenameCallback } from '../Utils';
import { ClearanceManager } from '../workers/ClearanceManager';
import { PropertiesManager } from '../workers/PropertiesManager';

const UPLOAD_PATH: string = 'uploads';
const propertiesManager: PropertiesManager = PropertiesManager.getInstance();
const clearanceManager: ClearanceManager = ClearanceManager.getInstance();

const storage: multer.StorageEngine = multer.diskStorage({
	destination: propertiesManager.TEMP_DIRECTORY,
	filename: (request: Express.Request, file: Express.Multer.File, callback: MulterStorageFilenameCallback): void => {
		const date: string = new Date().getTime().toLocaleString();
		callback(null, file.originalname /*path.basename(file.originalname) + '_' + date + path.extname(file.originalname)*/);
	}
});

const upload: multer.Instance = multer({ storage: storage });
const restRouter: Router = Router();

restRouter.use(bodyParser.json());
restRouter.use(bodyParser.urlencoded({
	extended: true
}));

// invoked for any requests passed to router
restRouter.use((request: Request, response: Response, next: Function) => {

	console.log('REST:', request.method, request.url);
	next();
});

// TODO:
// route middleware to validate :name
restRouter.param('name', (request: Request, response: Response, next: Function, name: string) => {
	// do validation on name here
	// log something so we know its working
	console.log('doing name validations on ', name);

	const addition: string = '?4398';
	name = name + addition;

	// once validation is done save the new item in the request
	request.body.name = name;
	// go to the next thing
	next();
});

// route with parameters (http://localhost:8080/rest/modifiedhello/:name)
restRouter.get('/mhello/:name', (request: Request, response: Response) => {
	response.send('Hello' + request.body.name + '!');
});

// route with parameters (http://localhost:8080/rest/hallo/:name)
restRouter.get('/hello/:name', (request: Request, response: Response) => {
	// not bound to params middleware
	response.send('Hello ' + request.params.name + '!');
});

restRouter.post('/upload', upload.single('avatar'), (request: Request, response: Response) => {
	if (!request.file) {
		console.log('No file received');

		return response.send({
			success: false
		});
	} else {
		console.log('File received:', request.file.originalname);

		// TODO: use appropriately
		const fileToPath: string = path.join(propertiesManager.ROOT_PATH, request.file.destination, request.file.originalname);
		clearanceManager.addFileToQueue(fileToPath);

		return response.send({
			success: true
		});
	}
});

export const Rest: Router = restRouter;
