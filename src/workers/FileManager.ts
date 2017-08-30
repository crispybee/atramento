import path = require('path');
import fs = require('fs-extra');
import { FileDocumentType } from "./DatabaseManager";

/**
 * @access singleton
 *
 * The FileManager creates, deletes and manages the document files in the filesystem.
 * Note: This class is a singleton! Access it by FileManager.getInstance(), not new FileManager()!
 */
export class FileManager {
	private static _instance: FileManager = new FileManager();
	private readonly logPrefix: string = 'FileManager:';

	constructor() {
		if(FileManager._instance) {
			throw new Error('Error: Instantiation failed: Use FileManager.getInstance() instead of new.');
		}

		FileManager._instance = this;

		this.moveToDocumentsFolder();
	}

	public static getInstance(): FileManager
	{
		return FileManager._instance;
	}

	private moveToDocumentsFolder(fileName?: string, fileType?: FileDocumentType): boolean {
		let sourcePath: string = path.join();

		// fs.moveSync('', '');

		// crypto.createHash('md5').update('asd', 'utf8').digest('hex');

		return true;
	}
}