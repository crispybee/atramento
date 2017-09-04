import * as fs from 'fs';
import * as path from 'path';
import { Server } from './atr/Server';
import { ClearanceManager } from './atr/workers/ClearanceManager';
import { DatabaseManager } from './atr/workers/DatabaseManager';
import { DocumentManager } from './atr/workers/DocumentManager';
import { FileManager } from './atr/workers/FileManager';
import { PropertiesManager } from './atr/workers/PropertiesManager';

async function main(): Promise<void> {
	const propertiesManager: PropertiesManager = PropertiesManager.getInstance();
	propertiesManager.setPath(__dirname);

	// setup project file structure
	const tempConvertedPath: string = path.join(
		propertiesManager.ROOT_PATH, propertiesManager.TEMP_DIRECTORY, propertiesManager.CONVERTED_DIRECTORY);
	if (!fs.existsSync(tempConvertedPath)) {
		console.log('File structure is created...');
		await fs.mkdirSync(tempConvertedPath);
		console.log('...done');
	}

	const databaseManager: DatabaseManager = DatabaseManager.getInstance();
	await databaseManager.createAndOpenDatabase();
	console.log('Database finished loading');

	const clearanceManager: ClearanceManager = ClearanceManager.getInstance();
	const fileManager: FileManager = FileManager.getInstance();
	const documentManager: DocumentManager = DocumentManager.getInstance();

	const server: Server = new Server();
	await server.start();

	console.log('Server startup finished');
}

main();
