import * as crypto from 'crypto';
import * as fileType from 'file-type';
import * as fs from 'fs-extra';
import * as isBinaryFile from 'isbinaryfile';
import { type } from 'os';
import * as readChunk from 'read-chunk';

import { 	FileDocumentType,
			QueueFile,
			RejectPromise,
			ResolveBooleanPromise,
			ResolveQueueFilePromise,
			ResolveStringPromise,
			ResolveVoidPromise } from '../Utils';
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

	private async checkIfFileIsBinary(fileBuffer: Buffer, byteNumber: number): Promise<boolean> {
		return new Promise<boolean>((resolve: ResolveBooleanPromise, reject: RejectPromise): void => {

			isBinaryFile(fileBuffer, byteNumber, (error: Error, result: boolean) => {
				if (!error) {
					resolve(result);
				} else {
					reject(error);
				}
			});
		});
	}

	private checkFileType(pathToFile: string): FileDocumentType {
		const byteNumber: number = 4100;
		const headerBuffer: Buffer = readChunk.sync(pathToFile, 0, byteNumber);
		const documentType: fileType.FileTypeResult = fileType(headerBuffer);
		const isBinary: boolean = isBinaryFile.sync(headerBuffer, byteNumber);
		let tempFileType: FileDocumentType = FileDocumentType.Unusable;

		console.log(this.logPrefix, 'The file is binary:', isBinary);

		if (documentType !== null) {
			switch (documentType.ext) {
				case 'png':
				case 'gif':
				case 'jpg':
					tempFileType = FileDocumentType.Image;
					break;
				case 'pdf':
					tempFileType = FileDocumentType.Pdf;
					break;
				default:
				// if not allowed file and not binary --> plaintext else unusable
					if (!isBinary) {
						tempFileType = FileDocumentType.Plaintext;
					} else {
						tempFileType = FileDocumentType.Unusable;
					}
					break;
			}
		} else {
			tempFileType = FileDocumentType.Unusable;

			// if not known and not binary --> plaintext else unusable
			if (!isBinary) {
				tempFileType = FileDocumentType.Plaintext;
			} else {
				tempFileType = FileDocumentType.Unusable;
			}
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

				const originalFileHash: string = await this.calculateSHA256Checksum(currentFile.Path);
				const isDuplicate: boolean = await this.documentManager.checkForDuplicate(originalFileHash);

				console.log(this.logPrefix, 'Is duplicate?', isDuplicate);

				if (isDuplicate) {
					console.log(this.logPrefix, 'Uploaded file is duplicate. Removing from temporary files...');

					// remove file from temp folder
					await fs.remove(currentFile.Path);

					// jump to next entry in queue
					continue;
				}

				const documentType: FileDocumentType = await this.checkFileType(currentFile.Path);

				let finalFile: QueueFile = currentFile;
				let finalFileHash: string = originalFileHash;
				let finalFileSize: number;
				let finalPath: string;

				if (documentType === FileDocumentType.Image) {
					console.log(this.logPrefix, 'File is a valid image. Start converting...');

					// if image, always convert to png
					finalFile = await this.fileManager.convertImageToPng(currentFile);
					console.log(this.logPrefix, 'Finished converting. Removing unconverted original...');

					// remove original file from temp folder, since converted duplicate exists now
					await fs.remove(currentFile.Path);
					console.log(this.logPrefix, 'Original removed.');

					// calculate hash of converted file
					finalFileHash = await this.calculateSHA256Checksum(finalFile.Path);

					const fileStats: fs.Stats = fs.statSync(finalFile.Path);
					finalFileSize = fileStats.size / 1000000.0;

					finalPath = await this.fileManager.moveToDocumentsFolder(finalFile, documentType, finalFileHash);

				} else if (documentType !== FileDocumentType.Unusable) {
					console.log(this.logPrefix, 'File is a valid document of:', documentType);

					// if PDF or Plaintext
					const fileStats: fs.Stats = fs.statSync(finalFile.Path);
					finalFileSize = fileStats.size / 1000000.0;

					finalPath = await this.fileManager.moveToDocumentsFolder(finalFile, documentType, finalFileHash);

				} else {
					// if unknown file format, stop
					console.log(this.logPrefix, 'File is not a valid document. Removing from temporary files...');

					// remove file from temp folder
					await fs.remove(currentFile.Path);

					// jump to next entry in queue
					continue;
				}

				await this.documentManager.addDocument(finalFile, originalFileHash, finalFileHash, finalPath, finalFileSize, documentType);

			} catch (error) {
				console.log(this.logPrefix, 'Error caught in workOffQueue():', error);
			}
		}

		this.queueIsWorking = false;
		console.log(this.logPrefix, 'Finished working off queue. Remaining queue:', this.fileQueue, 'Queue is working:', this.queueIsWorking);
	}
}
