import * as crypto from 'crypto';
import * as fileType from 'file-type';
import * as fs from 'fs-extra';
import { type } from 'os';
import * as readChunk from 'read-chunk';

import { FileDocumentType, QueueFile, RejectPromise, ResolveBooleanPromise, ResolveStringPromise, ResolveVoidPromise } from '../Utils';
import { DocumentManager } from './DocumentManager';
import { FileManager } from './FileManager';
import { PropertiesManager } from './PropertiesManager';

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
	private documentManager: DocumentManager;
	private propertiesManager: PropertiesManager;
	private fileManager: FileManager;
	private fileQueue: QueueFile[] = [];
	private queueIsWorking: boolean = false;

	constructor() {
		if (ClearanceManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use ClearanceManager.getInstance() instead of new.');
		}

		ClearanceManager.INSTANCE = this;

		this.documentManager = DocumentManager.getInstance();
		this.propertiesManager = PropertiesManager.getInstance();
		this.fileManager = FileManager.getInstance();
		this.fileQueue = [];
		this.queueIsWorking = false;
	}

	public static getInstance(): ClearanceManager {
		return ClearanceManager.INSTANCE;
	}

	// public addFilesToQueue(filePaths: string[]) {
	public addFileToQueue(filePath: string, formerFileName: string, tempFileName: string, desiredFileName?: string): void {
		let desiredFileNameHelper: string;

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

	private checkFileType(pathToFile: string): FileDocumentType {
		const headerBuffer: Buffer = readChunk.sync(pathToFile, 0, 4100);
		const documentType: fileType.FileTypeResult = fileType(headerBuffer);
		let tempFileType: FileDocumentType = FileDocumentType.Unusable;

		// TODO: maybe epub in the future
		if (documentType !== null) {
			switch (documentType.ext) {
				case 'png':
					tempFileType = FileDocumentType.Image;
					break;
				case 'jpg':
					// TODO: convert to png
					tempFileType = FileDocumentType.Image;
					break;
				case 'gif':
					// TODO: convert to png
					tempFileType = FileDocumentType.Image;
					break;
				case 'bmp':
					// TODO: convert to png
					tempFileType = FileDocumentType.Image;
					break;
				case 'pdf':
					tempFileType = FileDocumentType.Pdf;
					break;
				default:
					break;
			}

		} else {
			// TODO: Check if plaintext or binary
			tempFileType = FileDocumentType.Unusable;
		}

		return tempFileType;
	}

	private async calculateSHA256Checksum(pathToFile: string): Promise<string> {
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

	private async workOffQueue(): Promise<void> {
		this.queueIsWorking = true;
		console.log(this.logPrefix, 'Start working off queue...', 'Queue is working:', this.queueIsWorking);

		while (this.fileQueue.length > 0) {
			try {
				console.log('Current queue number:', this.fileQueue.length);

				const currentFile: QueueFile = this.fileQueue.shift();
				console.log(currentFile);

				if (currentFile.Path === undefined) {
					continue;
				}

				const currentFileHash: string = await this.calculateSHA256Checksum(currentFile.Path);
				const isDuplicate: boolean = await this.documentManager.checkForDuplicate(currentFileHash);

				console.log(this.logPrefix, 'Is duplicate?', isDuplicate);

				if (isDuplicate) {
					console.log(this.logPrefix, 'Uploaded file is duplicate. Removing from temporary files...');

					// remove file from temp folder
					await fs.remove(currentFile.Path);

					// jump to next entry in queue
					continue;
				}

				const documentType: FileDocumentType = await this.checkFileType(currentFile.Path);
				const currentFileStats: fs.Stats = fs.statSync(currentFile.Path);
				const currentFileSize: number = currentFileStats.size / 1000000.0;
				let finalPath: string;

				// if unknown file format, stop
				if (documentType !== FileDocumentType.Unusable) {
					console.log(this.logPrefix, 'File is a valid document');
					finalPath = await this.fileManager.moveToDocumentsFolder(currentFile, documentType, currentFileHash);
				} else {
					console.log(this.logPrefix, 'File is not a valid document. Removing from temporary files...');

					// remove file from temp folder
					await fs.remove(currentFile.Path);

					// jump to next entry in queue
					continue;
				}

				await this.documentManager.addDocument(currentFile, currentFileHash, finalPath, currentFileSize, documentType);

			} catch (error) {
				console.log(this.logPrefix, 'Error caught in workOffQueue():', error);
			}
		}

		this.queueIsWorking = false;
		console.log(this.logPrefix, 'Finished working off queue. Remaining queue:', this.fileQueue, 'Queue is working:', this.queueIsWorking);
	}
}
