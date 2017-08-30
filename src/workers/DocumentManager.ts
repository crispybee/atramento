/**
 * @access singleton
 *
 * The DocumentManager manages the documents in Atramento.
 * Note: This class is a singleton! Access it by DocumentManager.getInstance(), not new DocumentManager()!
 */
export class DocumentManager {
	private static INSTANCE: DocumentManager = new DocumentManager();
	private readonly logPrefix: string = 'DocumentManager:';

	constructor() {
		if (DocumentManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use DocumentManager.getInstance() instead of new.');
		}

		DocumentManager.INSTANCE = this;
	}

	public static getInstance(): DocumentManager {
		return DocumentManager.INSTANCE;
	}

	public AddDocument(pathToFile: string, hash: string, size: number, documentType: string, requestedName?: string): void {
		if (requestedName) {
			console.log('Add new doc of type', documentType, 'called', requestedName, 'with size', size, 'MB, hash of', hash, 'from', pathToFile);
		} else {
			console.log('Adding new document of type', documentType, 'with a size of', size, 'MB and a hash of', hash, 'from', pathToFile);
		}
	}
}
