import { type } from "os";
import fs = require('fs-extra');
import readChunk = require('read-chunk');
import crypto = require('crypto');
import fileType = require('file-type');

import { DatabaseManager, FileDocumentType } from "./DatabaseManager";
import { DocumentManager } from "./DocumentManager";


/**
 * @access singleton
 *
 * The ClearanceManager moves the uploaded files from the temporary folder to the permanent folder.
 * It also categorizes the files and adds the moved files information to the database.
 * Note: This class is a singleton! Access it by ClearanceManager.getInstance(), not new ClearanceManager()!
 */
export class ClearanceManager {
	private static _instance: ClearanceManager = new ClearanceManager();
	private readonly logPrefix: string = 'ClearanceManager:';
	private databaseManager: DatabaseManager;
	private documentManager: DocumentManager;
	private fileQueue: string[] = [];
	private queueIsWorking: boolean = false;

	constructor() {
		if(ClearanceManager._instance){
			throw new Error("Error: Instantiation failed: Use ClearanceManager.getInstance() instead of new.");
		}

		ClearanceManager._instance = this;

		this.databaseManager = DatabaseManager.getInstance();
		this.documentManager = DocumentManager.getInstance();
//		this.fileQueue = ['1', '2', '3', '4'];
		this.fileQueue = [];
		this.queueIsWorking = false;

		// this.addFilesToQueue(['C:\\Users\\Tim\\Desktop\\atramento\\dist\\temp_uploads\\MMK_final.7z', 'C:\\Users\\Tim\\Desktop\\atramento\\dist\\temp_uploads\\HRMI_1_2017.pdf']);

		/*setTimeout(() => {
			this.addFilesToQueue(['5', '6', '7']);
		}	, 7000);
*/
		// this.hashCaller('./asdasd.txt', './MMK_final.7z', './asdasd.txt', './MMK_final.7z', './asdasd.txt', './asdasd.txt', './asdasd.txt', './asdasd.txt', './asdasd.txt');

		/*
		let headerBuffer = readChunk.sync('./1', 0, 4100);
		let documentType: fileType.FileTypeResult = fileType(headerBuffer);

		if(documentType !== null) {
			console.log('FILE type', documentType.ext, documentType.mime);
		}
		*/
	}

	public static getInstance(): ClearanceManager
	{
		return ClearanceManager._instance;
	}

	// public addFilesToQueue(filePaths: string[]) {
	public addFileToQueue(filePath: string) {
		this.fileQueue = this.fileQueue.concat(filePath);

		console.log('Added new file to queue:', filePath);

		// if queue is not being worked on, work on it
		if(!this.queueIsWorking) {
			this.workOffQueue();
		}
	}

	public addFilesToQueue(filePaths: string[]) {
		this.fileQueue = this.fileQueue.concat(filePaths);

		console.log('Added new files to queue', filePaths);

		// if queue is not being worked on, work on it
		if(!this.queueIsWorking) {
			this.workOffQueue();
		}
	}

	private async checkIfDuplicate(fileSHA256Hash: string): Promise<boolean> {
		// TODO: Get hashes from database and compare -> outsource method to DatabaseManager
		return new Promise<boolean>((resolve, reject) => {
			// FIXME: Not checked for async yet
			resolve(this.databaseManager.checkForDuplicate(fileSHA256Hash));
		});
	}

	private checkFileType(pathToFile: string): string /*FileDocumentType*/ {
		let headerBuffer = readChunk.sync(pathToFile, 0, 4100);
		let documentType: fileType.FileTypeResult = fileType(headerBuffer);

		// TODO: maybe epub in the future
		if(documentType !== null) {
			switch(documentType.ext) {
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
			}
		} else {
			// TODO: Check if plaintext or binary
		}

		return documentType.mime;
	}

	private async hashCaller(...files: string[]): Promise<void> {
		let answer: string = await this.calculateSHA256Checksum('./asdasd.txt');
		console.log(this.logPrefix, 'Hashes:', answer);

		let index: number = 0;

		for(let file of files) {
			let currentFileHash: string = await this.calculateSHA256Checksum(file);
			console.log(this.logPrefix, 'Hash ' + index + ':', currentFileHash);
			index++;
		}

		console.log('Finished hashing');
	}

	private calculateSHA256Checksum(pathToFile: string): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let hash: crypto.Hash = crypto.createHash('sha256');

			let currentStream: fs.ReadStream = fs.createReadStream(pathToFile)
			.on('data', chunk => {
				hash.update(chunk, 'utf8');
				// console.log(this.logPrefix, 'Chunk' + index, chunk);
			}).on('end', () => {
				let calculatedHash = hash.digest('hex');
				console.log(this.logPrefix, 'Calculated hash:', calculatedHash);
				resolve(calculatedHash);
			}).on('error', error => {
				console.log(this.logPrefix, 'Error caught in calculateSHA256Checksum():', error);
				reject(error);
			});
		});
	}

	// FIXME: temporary async tester
	private stopper(time: number): Promise<void> {
		return new Promise<void> ((resolve) => {

			setTimeout(()=> {
			console.log('stop stopper');
			resolve();
			}, time);
		});
	}

	private async workOffQueue(): Promise<void> {
		this.queueIsWorking = true;
		console.log(this.logPrefix, 'Start working off queue...', 'Queue is working:', this.queueIsWorking);

		while(this.fileQueue.length > 0) {
			try {
				// await this.stopper(3000);
				console.log('Current queue number:', this.fileQueue.length);
				console.log('File of queue:', this.fileQueue[0]);

				let currentFile: string = this.fileQueue.shift();
				console.log(currentFile);
				if(currentFile === undefined) {
					continue;
				}

				let currentFileStats = fs.statSync(currentFile);
				let currentFileSize = currentFileStats.size / 1000000.0;
				let currentFileHash: string = await this.calculateSHA256Checksum(currentFile);
				let isDuplicate: boolean = await this.checkIfDuplicate(currentFileHash);

				if(isDuplicate) {
					console.log(this.logPrefix, 'Uploaded file is duplicate. Removing from temporary files...');
					// TODO: FileManager remove from temp
					continue;
				}

				let documentType: string = await this.checkFileType(currentFile);

				await this.documentManager.AddDocument(currentFile, currentFileHash, currentFileSize, documentType, 'Desired document name');
			} catch(error) {
			console.log(this.logPrefix, 'Error caught in workOffQueue():', error);
			}
		}

		this.queueIsWorking = false;
		console.log(this.logPrefix, 'Finished working off queue. Remaining queue:', this.fileQueue, 'Queue is working:', this.queueIsWorking);
	}
}