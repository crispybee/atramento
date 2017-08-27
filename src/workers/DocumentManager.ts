/**
 * @access singleton
 *
 * The DocumentManager manages the documents in Atramento.
 * Note: This class is a singleton! Access it by DocumentManager.getInstance(), not new DocumentManager()!
 */
export class DocumentManager {
	private static _instance: DocumentManager = new DocumentManager();

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
}