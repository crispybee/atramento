import * as os from 'os';
import * as sqlite3 from 'sqlite3';
import { FileDocumentType, IDatabaseFileEntry, RejectPromise, ResolveBooleanPromise, ResolveVoidPromise } from '../Utils';
sqlite3.verbose();

/**
 * @access singleton
 *
 * The DatabaseManager creates and manages the sqlite3 database.
 * Note: This class is a singleton! Access it by DatabaseManager.getInstance(), not new DatabaseManager()!
 */
export class DatabaseManager {
	private static INSTANCE: DatabaseManager = new DatabaseManager();
	private readonly logPrefix: string = 'DatabaseManager:';
	private database : sqlite3.Database;
	private date: Date = new Date();
	private dateTimezoneOffset: number = this.date.getTimezoneOffset();

	private readonly fileTableName: string = 'File';
	private readonly documentPdfTableName: string = 'DocumentPDF';
	private readonly documentPlaintextTableName: string = 'DocumentPlaintext';
	private readonly documentImageTableName: string = 'DocumentImage';

	constructor() {
		if (DatabaseManager.INSTANCE) {
			throw new Error('Error: Instantiation failed: Use DatabaseManager.getInstance() instead of new.');
		}

		DatabaseManager.INSTANCE = this;

		// this.createAndOpenDatabase();
	}

	public static getInstance(): DatabaseManager {
		return DatabaseManager.INSTANCE;
	}

	public async checkForDuplicate(hashSHA256: string): Promise<boolean> {
		return new Promise<boolean>((resolve: ResolveBooleanPromise, reject: RejectPromise): void => {
			console.log(this.logPrefix, 'Checking for hash', hashSHA256, 'in database...');

			this.database.all(
				// tslint:disable-next-line:max-line-length
				`SELECT * FROM ${this.fileTableName} WHERE originalChecksum="${hashSHA256}"`, (done: sqlite3.Statement, result: IDatabaseFileEntry[]) => {

				let returnValue: boolean | Error;

				// null is success
				if (done === null) {
					console.log(this.logPrefix, 'Checking was executed successfully', done, result.length);
					console.log(this.logPrefix, 'Result parameter:', result, 'Count of result:', result.length);

					// entry exists already
					if (result.length > 0) {
						returnValue = true;
					} else {
						// new entry
						returnValue = false;
					}

					resolve(returnValue);
				} else {
					console.log(this.logPrefix, done);
					reject(new Error('Could not search for entry!'));
				}
			});
		});
	}

	public async addEntryToFileTable(
		// tslint:disable-next-line:max-line-length
		originalHash: string, convertedHash: string, filePath: string, fileType: FileDocumentType, date: number, name: string, originalFileName: string): Promise<void> {
		return new Promise<void>((resolve: ResolveVoidPromise, reject: RejectPromise): void => {

			const statement: sqlite3.Statement = this.database.prepare(
				`INSERT INTO ${this.fileTableName}(
					originalChecksum,
					convertedChecksum,
					filePath,
					fileType,
					createdOn,
					name,
					oldFileName)
					VALUES (?, ?, ?, ?, ?, ?, ?)`);

			statement.run(originalHash, convertedHash, filePath, fileType, date, name, originalFileName);

			statement.finalize((callback: Error) => {
				console.log(this.logPrefix, 'Added entry', convertedHash, 'to', this.fileTableName);
				resolve();
			});
		});
	}

	public async createAndOpenDatabase(): Promise<void> {
		return new Promise<void> ((resolve: (value?: void | PromiseLike<void>) => void, reject: (reason?: {}) => void): void => {
			this.database = new sqlite3.Database('./documents.amo', (callback: Error): void => {
				if (callback === null) {
					console.log(this.logPrefix, 'Database was opened successfully');

					try {
						resolve(this.checkAndSetupDatabase());
					} catch (error) {
						console.log(this.logPrefix, 'Could not set up database:', error);
						reject(error);
					}
				} else {
					console.log(this.logPrefix, 'Error: ', callback, os.EOL, 'Closing server application...');
					process.exit();
				}
			});
		});
	}

	private async checkAndSetupDatabase(): Promise<void> {
		const emptyDatabase: boolean = await this.isDatabaseEmpty();
		console.log(this.logPrefix, 'Database is empty:', emptyDatabase);

		/* TODO: Not yet implemented
		let validDatabase: boolean = await this.isDatabaseStructureValid();
		console.log(this.logPrefix, 'NOT YET IMPLEMENTED - Database is valid:', validDatabase);
		*/

		if (emptyDatabase) {
			await this.createNewDatabaseStructure();
		}
	}

	// Not needed yet
	private setupDatabaseTriggers(): void {
		// TODO: setup database triggers according to database version
		// TODO: These must be parameters in the createFileInDatabase method!
		const documentType: FileDocumentType = FileDocumentType.Pdf;
		const fileId: string = '1';
		const documentName: string = 'Example Document';

		const sqlString: string = `
			CREATE TRIGGER TriggerAutoAddDocumentEntriesFromFile
			AFTER INSERT ON File
			BEGIN
				SELECT
				CASE
					WHEN NEW.fileType="PDF" THEN
						INSERT INTO DocumentPDF (fileID, name) VALUES ("NEW.id", "NEW.name")
					WHEN NEW.fileType="Plaintext" THEN
						INSERT INTO DocumentPlaintext (fileID, name) VALUES ("NEW.id", "NEW.name")
					WHEN NEW.fileType="Image" THEN
						INSERT INTO DocumentImage (fileID, name) VALUES ("NEW.id", "NEW.name")
					ELSE
						RAISE (FAIL, "It was not possible to create the document entry copy.")
			END;
			`;

		// TODO: put newly created entries like DocumentPDF on update list after insert -> manual filling of entry
	}

	private isDatabaseEmpty(): Promise<boolean> {
		return new Promise<boolean>((resolve: ResolveBooleanPromise, reject: RejectPromise): void => {
			console.log(this.logPrefix, 'Checking tables in database...');

			// get all table names
			/*' AND name="' + this.documentTableName + '"'*/
			this.database.all('SELECT name FROM sqlite_master WHERE type="table"', (done: sqlite3.Statement, result: {}[]) => {

				let returnValue: boolean | Error;

				// null is success
				if (done === null) {
					console.log(this.logPrefix, 'Checking was executed successfully', done, result.length);
					console.log(this.logPrefix, 'Result parameter:', result, 'Count of result:', result.length);

					// table exists
					if (result.length > 0) {
						// check if the database structure is valid
						returnValue = false; // this.isDatabaseStructureValid();
					} else {
						// empty database
						returnValue = true;
					}

					resolve(returnValue);
				} else {
					console.log(this.logPrefix, done);
					reject(new Error('Could not create or open database!'));
				}
			});
		});
	}

	// TODO:
	private isDatabaseStructureValid(): boolean {
		return false;
	}

	private async createNewDatabaseStructure(): Promise<void> {
		console.log(this.logPrefix, 'Setting up database structure...');

		await this.createFileTable();
		await this.createDocumentPDFTable();
		// await this.fillFileTable();
		// await this.fillDocumentPDFTable();

		console.log(this.logPrefix, 'Finished setting up new database');

		/*
			this.database.each('SELECT row AS id, checksum, filePath, fileType, createdOn, name FROM ' + this.fileTableName, (error, row) => {
				console.log(this.logPrefix, error, row);
				console.log(this.logPrefix, row.id, row.checksum, row.filePath, row.fileType, row.createdOn, row.name);
			});
		*/
	}

	private async createFileTable(): Promise<void> {
		return new Promise<void>((resolve: ResolveVoidPromise, reject: RejectPromise): void => {
			// TODO: create DocumentPlaintext and DocumentImage tables + initialization of Triggers
			// create File table
			this.database.run(
				`CREATE TABLE "${this.fileTableName}" (
				"id" INTEGER NOT NULL PRIMARY KEY UNIQUE,
				"originalChecksum" TEXT NOT NULL UNIQUE,
				"convertedChecksum" TEXT NOT NULL UNIQUE,
				"filePath" TEXT NOT NULL UNIQUE,
				"fileType" TEXT NOT NULL,
				"createdOn" TEXT NOT NULL,
				"name" TEXT NOT NULL,
				"oldFileName" TEXT NOT NULL
			)`,
				(callback: Error) => {
				if (callback === null) {
					console.log(this.logPrefix, 'Successfully added table', this.fileTableName);
					resolve();
				} else {
					reject(new Error('ERROR: Could not write tables: ' + callback));
				}
			});
		});
	}

	private async createDocumentPDFTable(): Promise<void> {
		return new Promise<void>((resolve: ResolveVoidPromise, reject: RejectPromise): void => {
			// create DocumentPDF table
			this.database.run(
				`CREATE TABLE "${this.documentPdfTableName}" (
				"id" INTEGER NOT NULL PRIMARY KEY UNIQUE,
				"fileID" INTEGER NOT NULL UNIQUE,
				"name" TEXT NOT NULL,
				FOREIGN KEY (fileID) REFERENCES File(id))`,
				(callback: Error) => {
				if (callback === null) {
					console.log(this.logPrefix, 'Successfully added table', this.documentPdfTableName);
					resolve();
				} else {
					reject(new Error('ERROR: Could not write tables: ' + callback));
				}
			});
		});
	}
}
