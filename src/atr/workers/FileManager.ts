import * as fs from 'fs-extra';
import * as path from 'path';
import { FileDocumentType, QueueFile } from '../Utils';
import { PropertiesManager } from './PropertiesManager';

/**
 * @access singleton
 *
 * The FileManager creates, deletes and manages the document files in the filesystem.
 * Note: This class is a singleton! Access it by FileManager.getInstance(), not new FileManager()!
 */
export class FileManager {
	private static INSTANCE: FileManager = new FileManager();
	private readonly logPrefix: string = 'FileManager:';
	private propertiesManager: PropertiesManager = PropertiesManager.getInstance();

	constructor() {
		if (FileManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use FileManager.getInstance() instead of new.');
		}

		FileManager.INSTANCE = this;
	}

	public static getInstance(): FileManager {
		return FileManager.INSTANCE;
	}

	public async moveToDocumentsFolder(currentFile: QueueFile, fileType: FileDocumentType, hash: string): Promise<string> {
		const finalPath: string = path.join(this.propertiesManager.ROOT_PATH, 'files', fileType, hash + path.extname(currentFile.OriginalName));
		try {
			await fs.move(currentFile.Path, finalPath, { overwrite: true });
			console.log(this.logPrefix, 'Moved file', currentFile.OriginalName, 'to', finalPath);

			return finalPath;
		} catch (error) {
			console.log(this.logPrefix, 'Error caught in moveToDocumentsFolder():', error);
		}
	}
}
