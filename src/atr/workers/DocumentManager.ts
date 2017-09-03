import * as path from 'path';
import { FileDocumentType, QueueFile, RemoveFileEnding } from '../Utils';
import { DatabaseManager } from './DatabaseManager';

/**
 * @access singleton
 *
 * The DocumentManager manages the documents in Atramento.
 * Note: This class is a singleton! Access it by DocumentManager.getInstance(), not new DocumentManager()!
 */
export class DocumentManager {
	private static INSTANCE: DocumentManager = new DocumentManager();
	private readonly logPrefix: string = 'DocumentManager:';
	private databaseManager: DatabaseManager;

	constructor() {
		if (DocumentManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use DocumentManager.getInstance() instead of new.');
		}

		DocumentManager.INSTANCE = this;

		this.databaseManager = DatabaseManager.getInstance();
	}

	public static getInstance(): DocumentManager {
		return DocumentManager.INSTANCE;
	}

	public async checkForDuplicate(hash: string): Promise<boolean> {
		const isDuplicate: boolean = await this.databaseManager.checkForDuplicate(hash);

		return isDuplicate;
	}

	// tslint:disable-next-line:max-line-length
	public async addDocument(currentFile: QueueFile, originalHash: string, convertedHash: string, finalPath: string, size: number, documentType: FileDocumentType): Promise<void> {
		let requestedName: string = currentFile.DesiredName;
		console.log('DESNAME', requestedName);

		if (requestedName !== undefined) {
			console.log('New doc of type', documentType, 'called', requestedName, 'size', size, 'MB, hash', originalHash, 'from', currentFile.Path);
		} else {
			console.log('New doc of type', documentType, 'with a size of', size, 'MB and a originalHash of', originalHash, 'from', currentFile.Path);

			// const temp: string =  currentFile.OriginalName.match(this.removeFileExtensionRegex);

			// requestedName = currentFile.OriginalName.replace(this.removeFileExtensionRegex, '');
			requestedName = RemoveFileEnding(currentFile.OriginalName);
			console.log('REQNAME', requestedName);
		}

		await this.databaseManager.addEntryToFileTable(
			originalHash, convertedHash, finalPath, documentType, Date.now(), requestedName, currentFile.OriginalName);
	}
}
