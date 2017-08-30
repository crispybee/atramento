import path = require('path');
import { Router, Request, Response } from 'express';
import multer = require('multer');
import bodyParser = require('body-parser');
import { ClearanceManager } from "../workers/ClearanceManager";
import { PropertiesManager } from "../workers/PropertiesManager";


const UPLOAD_PATH: string = 'uploads';
let propertiesManager: PropertiesManager = PropertiesManager.getInstance();
let clearanceManager: ClearanceManager = ClearanceManager.getInstance();

let storage: multer.StorageEngine = multer.diskStorage({
	destination: propertiesManager.TEMP_DIRECTORY,
	filename: function (request, file, callback) {
		let date = new Date().getTime().toLocaleString();
		callback(null, file.originalname /*path.basename(file.originalname) + '_' + date + path.extname(file.originalname)*/);
	}
});

let upload: multer.Instance = multer({ storage: storage });
let restRouter: Router = Router();

restRouter.use(bodyParser.json());
restRouter.use(bodyParser.urlencoded({
	extended: true
}));

// invoked for any requests passed to router
restRouter.use((request, response, next) => {

	console.log('REST:', request.method, request.url);
	next();
});


// TODO:
// route middleware to validate :name
restRouter.param('name', (request, response, next, name) => {
	// do validation on name here
	// log something so we know its working
	console.log('doing name validations on ' + name);

	name = name + '?4398';

	// once validation is done save the new item in the request
	request.body.name = name;
	// go to the next thing
	next();
});

// route with parameters (http://localhost:8080/rest/modifiedhello/:name)
restRouter.get('/mhello/:name', (request, response) => {
	response.send('Hello ' + request.body.name + '!');
});

// route with parameters (http://localhost:8080/rest/hallo/:name)
restRouter.get('/hello/:name', (request, response) => {
	// not bound to params middleware
	response.send('Hello ' + request.params.name + '!');
});

restRouter.post('/upload', upload.single('avatar'), (request, response) => {
	if(!request.file) {
		console.log("No file received");
		return response.send({
			success: false
		});
	} else {
		console.log("File received:", request.file.originalname);

		// TODO: use appropriately
		let fileToPath: string = path.join(propertiesManager.ROOT_PATH, request.file.destination, request.file.originalname);
		clearanceManager.addFileToQueue(fileToPath);

		return response.send({
			success: true
		});
	}
});

export const Rest: Router = restRouter;