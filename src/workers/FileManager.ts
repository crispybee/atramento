import * as fs from 'fs-extra';
import * as path from 'path';
import { FileDocumentType } from '../Utils';

/**
 * @access singleton
 *
 * The FileManager creates, deletes and manages the document files in the filesystem.
 * Note: This class is a singleton! Access it by FileManager.getInstance(), not new FileManager()!
 */
export class FileManager {
	private static INSTANCE: FileManager = new FileManager();
	private readonly logPrefix: string = 'FileManager:';

	constructor() {
		if (FileManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use FileManager.getInstance() instead of new.');
		}

		FileManager.INSTANCE = this;

		this.moveToDocumentsFolder();
	}

	public static getInstance(): FileManager {
		return FileManager.INSTANCE;
	}

	private moveToDocumentsFolder(fileName?: string, fileType?: FileDocumentType): boolean {
		const sourcePath: string = path.join();

		// fs.moveSync('', '');

		// crypto.createHash('md5').update('asd', 'utf8').digest('hex');

		return true;
	}
}
