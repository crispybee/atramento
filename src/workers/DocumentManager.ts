import { FileDocumentType } from "./DatabaseManager";

/**
 * @access singleton
 *
 * The DocumentManager manages the documents in Atramento.
 * Note: This class is a singleton! Access it by DocumentManager.getInstance(), not new DocumentManager()!
 */
export class DocumentManager {
	private static _instance: DocumentManager = new DocumentManager();
	private readonly logPrefix: string = 'DocumentManager:';

	constructor() {
		if(DocumentManager._instance) {
			throw new Error('Error: Instantiation failed: Use DocumentManager.getInstance() instead of new.');
		}

		DocumentManager._instance = this;
	}

	public static getInstance(): DocumentManager
	{
		return DocumentManager._instance;
	}

	public AddDocument(pathToFile: string, hash: string, size: number, documentType: string, requestedName?: string) {
		if(requestedName) {
			console.log('Adding new document of type', documentType, 'called', requestedName, 'with a size of', size, 'MB and a hash of', hash, 'from', pathToFile);
		} else {
			console.log('Adding new document of type', documentType, 'with a size of', size, 'MB and a hash of', hash, 'from', pathToFile);
		}
	}
}