import readChunk = require('read-chunk');
import fileType = require('file-type');

import { DatabaseManager, FileDocumentType } from "./DatabaseManager";

/**
 * @access singleton
 *
 * The ClearanceManager moves the uploaded files from the temporary folder to the permanent folder.
 * It also categorizes the files and adds the moved files information to the database.
 * Note: This class is a singleton! Access it by ClearanceManager.getInstance(), not new ClearanceManager()!
 */
export class ClearanceManager {
	private static _instance: ClearanceManager = new ClearanceManager();
	private databaseManager: DatabaseManager;
	private fileQueue: string[] = [];
	private queueIsWorking: boolean = false;

	constructor() {
		if(ClearanceManager._instance){
			throw new Error("Error: Instantiation failed: Use ClearanceManager.getInstance() instead of new.");
		}

		ClearanceManager._instance = this;

		this.databaseManager = DatabaseManager.getInstance();
		this.fileQueue = [];
		this.queueIsWorking = false;

		this.addFilesToQueue();
	}

	public static getInstance(): ClearanceManager
	{
		return ClearanceManager._instance;
	}

	public addFilesToQueue(...files: string[]) {
		// this.fileQueue.concat(files);

		// TODO:

		if(!this.queueIsWorking) {
			this.workOffQueue();
		}
	}

	private checkIfDuplicate(): void {
		// TODO:
	}

	private checkFileType(): FileDocumentType {
		// TODO:
		return 'PDF';
	}

	private workOffQueue() {
		this.queueIsWorking = true;

		// TODO: work

		this.queueIsWorking = false;
	}
}