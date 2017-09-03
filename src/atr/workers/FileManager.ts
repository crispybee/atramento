import * as fs from 'fs-extra';
import * as path from 'path';
import * as sharp from 'sharp';
import { FileDocumentType, FileEnding, QueueFile, RejectPromise, RemoveFileEnding, ResolveQueueFilePromise } from '../Utils';
import { PropertiesManager } from './PropertiesManager';

/**
 * @access singleton
 *
 * The FileManager creates, deletes and manages the document files in the filesystem.
 * Note: This class is a singleton! Access it by FileManager.getInstance(), not new FileManager()!
 */
export class FileManager {
	private static INSTANCE: FileManager = new FileManager();
	private readonly logPrefix: string = 'FileManager:';
	private propertiesManager: PropertiesManager = PropertiesManager.getInstance();

	constructor() {
		if (FileManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use FileManager.getInstance() instead of new.');
		}

		FileManager.INSTANCE = this;

		// stop sharp from blocking the files
		sharp.cache(false);
	}

	public static getInstance(): FileManager {
		return FileManager.INSTANCE;
	}

	public async moveToDocumentsFolder(currentFile: QueueFile, fileType: FileDocumentType, hash: string): Promise<string> {
		let fileEnding: string = '';

		switch (fileType) {
			case FileDocumentType.Image:
				fileEnding = FileEnding.Image;
				break;
			case FileDocumentType.Pdf:
				fileEnding = FileEnding.Pdf;
				break;
			case FileDocumentType.Plaintext:
				fileEnding = FileEnding.Plaintext;
				break;
			default:
			break;
		}

		const finalPath: string = path.join(this.propertiesManager.ROOT_PATH, 'files', fileType, hash + fileEnding);

		try {
			await fs.move(currentFile.Path, finalPath, { overwrite: true });
			console.log(this.logPrefix, 'Moved file', currentFile.Path, 'to', finalPath);

			return finalPath;
		} catch (error) {
			console.log(this.logPrefix, 'Error caught in moveToDocumentsFolder():', error);
		}
	}

	public async convertImageToPng(currentFile: QueueFile): Promise<QueueFile> {
		/*
		return new Promise<QueueFile>((resolve: ResolveQueueFilePromise, reject: RejectPromise): void => {
			const convertedFile: QueueFile = new QueueFile(
				'asd' + currentFile.TempName + '.png', currentFile.OriginalName, currentFile.TempName, currentFile.DesiredName);

			sharp(currentFile.Path).toFormat(sharp.format.png).toFile(convertedFile.Path).then((output: sharp.OutputInfo) => {
				console.log('CONVERTED OUTPUT', output);
				console.log('CONVERTED FILE', convertedFile);
				resolve(convertedFile);
			}).catch((error: Error) => {
				console.log(this.logPrefix, 'Error caught in convertImageToPng():', error);
				reject(error);
			});
		});
		*/

		try {
			const convertedTempName: string = RemoveFileEnding(currentFile.TempName);

			const convertedFile: QueueFile = new QueueFile(
				path.join(
					this.propertiesManager.ROOT_PATH,
					this.propertiesManager.TEMP_DIRECTORY,
					this.propertiesManager.CONVERTED_DIRECTORY,
					convertedTempName),
				currentFile.OriginalName,
				currentFile.TempName,
				currentFile.DesiredName);

			console.log('Convert', currentFile.Path, 'to', convertedFile.Path);

			await sharp(currentFile.Path).toFormat(sharp.format.png).toFile(convertedFile.Path);
			console.log('converted!');

			return convertedFile;
		} catch (error) {
			console.log(this.logPrefix, 'Error caught in convertImageToPng():', error);
			throw new Error(error);
		}
	}
}
