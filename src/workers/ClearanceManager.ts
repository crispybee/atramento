import * as crypto from 'crypto';
import * as fileType from 'file-type';
import * as fs from 'fs-extra';
import { type } from 'os';
import * as readChunk from 'read-chunk';

import { QueueFile, RejectPromise, ResolveBooleanPromise, ResolveStringPromise, ResolveVoidPromise } from '../Utils';
import { DatabaseManager } from './DatabaseManager';
import { DocumentManager } from './DocumentManager';

/**
 * @access singleton
 *
 * The ClearanceManager moves the uploaded files from the temporary folder to the permanent folder.
 * It also categorizes the files and adds the moved files information to the database.
 * Note: This class is a singleton! Access it by ClearanceManager.getInstance(), not new ClearanceManager()!
 */
export class ClearanceManager {
	private static INSTANCE: ClearanceManager = new ClearanceManager();
	private readonly logPrefix: string = 'ClearanceManager:';
	private databaseManager: DatabaseManager;
	private documentManager: DocumentManager;
	private fileQueue: QueueFile[] = [];
	private queueIsWorking: boolean = false;

	constructor() {
		if (ClearanceManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use ClearanceManager.getInstance() instead of new.');
		}

		ClearanceManager.INSTANCE = this;

		this.databaseManager = DatabaseManager.getInstance();
		this.documentManager = DocumentManager.getInstance();
		this.fileQueue = [];
		this.queueIsWorking = false;
		/*
		let headerBuffer = readChunk.sync('./1', 0, 4100);
		let documentType: fileType.FileTypeResult = fileType(headerBuffer);

		if(documentType !== null) {
			console.log('FILE type', documentType.ext, documentType.mime);
		}
		*/
	}

	public static getInstance(): ClearanceManager {
		return ClearanceManager.INSTANCE;
	}

	// public addFilesToQueue(filePaths: string[]) {
	public addFileToQueue(filePath: string, formerFileName: string, tempFileName: string, desiredFileName?: string): void {
		let desiredFileNameHelper: string = formerFileName;

		if (desiredFileName) {
			desiredFileNameHelper = desiredFileName;
		}

		const file: QueueFile = new QueueFile(filePath, formerFileName, tempFileName, desiredFileNameHelper);
		this.fileQueue = this.fileQueue.concat(file);

		console.log('Added new file to queue:', file);

		// if queue is not being worked on, work on it
		if (!this.queueIsWorking) {
			this.workOffQueue();
		}
	}

	public addFilesToQueue(files: QueueFile[]): void {
		this.fileQueue = this.fileQueue.concat(files);

		console.log('Added new files to queue', files);

		// if queue is not being worked on, work on it
		if (!this.queueIsWorking) {
			this.workOffQueue();
		}
	}

	private async checkIfDuplicate(fileSHA256Hash: string): Promise<boolean> {
		// TODO: Get hashes from database and compare -> outsource method to DatabaseManager
		return new Promise<boolean>((resolve: ResolveBooleanPromise, reject: RejectPromise): void => {
			// FIXME: Not checked for async yet
			resolve(this.databaseManager.checkForDuplicate(fileSHA256Hash));
		});
	}

	private checkFileType(pathToFile: string): string /*FileDocumentType*/ {
		const headerBuffer: Buffer = readChunk.sync(pathToFile, 0, 4100);
		const documentType: fileType.FileTypeResult = fileType(headerBuffer);

		// TODO: maybe epub in the future
		if (documentType !== null) {
			switch (documentType.ext) {
				case 'png':
					// TODO: go on
					break;
				case 'jpg':
					// TODO: convert to png
					break;
				case 'gif':
					// TODO: convert to png
					break;
				case 'bmp':
					// TODO: convert to png
					break;
				case 'pdf':
					// TODO: go on
					break;
				default:
					break;
			}
		} else {
			// TODO: Check if plaintext or binary
		}

		return documentType.mime;
	}

	private async hashCaller(...files: string[]): Promise<void> {
		const answer: string = await this.calculateSHA256Checksum('./asdasd.txt');
		console.log(this.logPrefix, 'Hashes:', answer);

		let index: number = 0;

		for (const file of files) {
			const currentFileHash: string = await this.calculateSHA256Checksum(file);
			console.log(this.logPrefix, 'Hash ' + index + ':', currentFileHash);
			index++;
		}

		console.log('Finished hashing');
	}

	private calculateSHA256Checksum(pathToFile: string): Promise<string> {
		return new Promise<string>((resolve: ResolveStringPromise, reject: RejectPromise): void => {
			const hash: crypto.Hash = crypto.createHash('sha256');

			const currentStream: fs.ReadStream = fs.createReadStream(pathToFile)
				.on('data', (chunk: Buffer) => {
					hash.update(chunk, 'utf8');
					// console.log(this.logPrefix, 'Chunk' + index, chunk);
				}).on('end', () => {
					const calculatedHash: string = hash.digest('hex');
					console.log(this.logPrefix, 'Calculated hash:', calculatedHash);
					resolve(calculatedHash);
				}).on('error', (error: Error) => {
					console.log(this.logPrefix, 'Error caught in calculateSHA256Checksum():', error);
					reject(error);
				});
		});
	}

	// FIXME: temporary async tester
	private stopper(time: number): Promise<void> {
		return new Promise<void>((resolve: ResolveVoidPromise, reject: RejectPromise): void => {

			setTimeout(() => { console.log('stop stopper');	resolve(); }, time);
		});
	}

	private async workOffQueue(): Promise<void> {
		this.queueIsWorking = true;
		console.log(this.logPrefix, 'Start working off queue...', 'Queue is working:', this.queueIsWorking);

		while (this.fileQueue.length > 0) {
			try {
				// await this.stopper(3000);
				console.log('Current queue number:', this.fileQueue.length);
				console.log('File of queue:', this.fileQueue[0]);

				const currentFile: QueueFile = this.fileQueue.shift();
				console.log(currentFile);

				const currentFilePath: string = currentFile.FilePath;

				if (currentFilePath === undefined) {
					continue;
				}

				const currentFileStats: fs.Stats = fs.statSync(currentFilePath);
				const currentFileSize: number = currentFileStats.size / 1000000.0;
				const currentFileHash: string = await this.calculateSHA256Checksum(currentFilePath);
				const isDuplicate: boolean = await this.checkIfDuplicate(currentFileHash);

				if (isDuplicate) {
					console.log(this.logPrefix, 'Uploaded file is duplicate. Removing from temporary files...');
					// TODO: FileManager remove from temp
					continue;
				}

				const documentType: string = await this.checkFileType(currentFilePath);

				await this.documentManager.AddDocument(currentFilePath, currentFileHash, currentFileSize, documentType, currentFile.FileDesiredName);
			} catch (error) {
				console.log(this.logPrefix, 'Error caught in workOffQueue():', error);
			}
		}

		this.queueIsWorking = false;
		console.log(this.logPrefix, 'Finished working off queue. Remaining queue:', this.fileQueue, 'Queue is working:', this.queueIsWorking);
	}
}
