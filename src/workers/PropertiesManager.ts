/**
 * @access singleton
 *
 * The PropertiesManager manages the properties in Atramento.
 * Note: This class is a singleton! Access it by PropertiesManager.getInstance(), not new PropertiesManager()!
 */
export class PropertiesManager {
	private static INSTANCE: PropertiesManager = new PropertiesManager();

	/** This variable sets the folder name for the temporary uploads destination. */
	public readonly TEMP_DIRECTORY: string = 'temp_uploads';
	public ROOT_PATH: string = 'temp_uploads';

	private readonly logPrefix: string = 'PropertiesManager:';

	constructor() {
		if (PropertiesManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use PropertiesManager.getInstance() instead of new.');
		}

		PropertiesManager.INSTANCE = this;
	}

	public static getInstance(): PropertiesManager {
		return PropertiesManager.INSTANCE;
	}

	public setPath(atramentoRootPath: string): void {
		this.ROOT_PATH = atramentoRootPath;
	}
}
