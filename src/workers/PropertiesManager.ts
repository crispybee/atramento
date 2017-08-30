/**
 * @access singleton
 *
 * The PropertiesManager manages the properties in Atramento.
 * Note: This class is a singleton! Access it by PropertiesManager.getInstance(), not new PropertiesManager()!
 */
export class PropertiesManager {
	private static _instance: PropertiesManager = new PropertiesManager();
	private readonly logPrefix: string = 'PropertiesManager:';

	/** This variable sets the folder name for the temporary uploads destination. */
	public readonly TEMP_DIRECTORY: string = 'temp_uploads';
	public ROOT_PATH: string = 'temp_uploads';

	constructor() {
		if(PropertiesManager._instance) {
			throw new Error('Error: Instantiation failed: Use PropertiesManager.getInstance() instead of new.');
		}

		PropertiesManager._instance = this;
	}

	public static getInstance(): PropertiesManager
	{
		return PropertiesManager._instance;
	}

	public setPath(atramentoRootPath: string) {
		this.ROOT_PATH = atramentoRootPath;
	}
}