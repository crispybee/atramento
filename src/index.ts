import * as fs from 'fs';
import { Server } from './atr/Server';
import { ClearanceManager } from './atr/workers/ClearanceManager';
import { DatabaseManager } from './atr/workers/DatabaseManager';
import { DocumentManager } from './atr/workers/DocumentManager';
import { FileManager } from './atr/workers/FileManager';
import { PropertiesManager } from './atr/workers/PropertiesManager';

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
