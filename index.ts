import * as fs from 'fs';
import { Server } from './src/Server';
import { ClearanceManager } from './src/workers/ClearanceManager';
import { DatabaseManager } from './src/workers/DatabaseManager';
import { DocumentManager } from './src/workers/DocumentManager';
import { FileManager } from './src/workers/FileManager';
import { PropertiesManager } from './src/workers/PropertiesManager';

async function main(): Promise<void> {
	const propertiesManager: PropertiesManager = PropertiesManager.getInstance();
	propertiesManager.setPath(__dirname);

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
