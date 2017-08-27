import os = require('os');
import sqlite3 = require('sqlite3');
sqlite3.verbose();

export type FileDocumentType = 'PDF' | 'Image' | 'Plaintext';


/**
 * @access singleton
 *
 * The DatabaseManager creates and manages the sqlite3 database.
 * Note: This class is a singleton! Access it by DatabaseManager.getInstance(), not new DatabaseManager()!
 */
export class DatabaseManager {
	private static _instance: DatabaseManager = new DatabaseManager();
	private database : sqlite3.Database;
	private date: Date = new Date();
	private dateTimezoneOffset: number = this.date.getTimezoneOffset();

	private readonly fileTableName: string = 'File';
	private readonly documentPdfTableName: string = 'DocumentPDF';
	private readonly documentPlaintextTableName: string = 'DocumentPlaintext';
	private readonly documentImageTableName: string = 'DocumentImage';

	constructor() {
		if(DatabaseManager._instance) {
			throw new Error('Error: Instantiation failed: Use DatabaseManager.getInstance() instead of new.');
		}

		DatabaseManager._instance = this;

		this.createAndOpenDatabase();
	}

	public static getInstance(): DatabaseManager
	{
		return DatabaseManager._instance;
	}
/*
	"id" INTEGER NOT NULL PRIMARY KEY UNIQUE,
	"checksum" TEXT NOT NULL UNIQUE,
	"filePath" TEXT NOT NULL UNIQUE,
	"fileType" TEXT NOT NULL,
	"createdOn" TEXT NOT NULL,
	"name" TEXT NOT NULL)`,
*/
	public addDocumentToDatabase(checksum: string, filePath: string, fileType: FileDocumentType, name: string): void {
		let createdOn: number = Date.now();

		// TODO: Add to Files and according Document table
		switch(fileType) {
			case 'PDF':
			break;
			case 'Plaintext':
			break;
			case 'Image':
			break;
		}

		// TODO: Execute SQL queries, for File and the Document..
		let statement: sqlite3.Statement = this.database.prepare('INSERT INTO ' + this.fileTableName + '(checksum, filePath, fileType, createdOn, name) VALUES (?, ?, ?, ?, ?)', callback => {
			// console.log('Prepared statement for filling: ', callback);
		});

		for (let i = 0; i < 10; i++) {
			statement.run('Ipsum' + i, '/path/to/fooX' + i, 'PDF', Date.now(), 'Example Document');
		}

		statement.finalize();
	}

	private createAndOpenDatabase() {
		this.database = new sqlite3.Database('./documents.amo', callback => {
			if(callback === null) {
				console.log('Database was opened successfully');

				this.checkAndSetupDatabase().catch(error => {
					console.log('Could not set up database:', error);
				});
			} else {
				console.log('Error: ', callback, os.EOL, 'Closing server application...');
				process.exit();
			}
		});
	}

	private async checkAndSetupDatabase(): Promise<void> {
		let emptyDatabase: boolean = await this.isDatabaseEmpty();
		console.log("Database is empty:", emptyDatabase);

		/* TODO: Not yet implemented
		let validDatabase: boolean = await this.isDatabaseStructureValid();
		console.log('NOT YET IMPLEMENTED - Database is valid:', validDatabase);
		*/

		await this.createNewDatabaseStructure(emptyDatabase);
		console.log('Database is ready to go', os.EOL);
	}

	// Not needed yet
	private setupDatabaseTriggers(): void {
		// TODO: setup database triggers according to database version
		// TODO: These must be parameters in the createFileInDatabase method!
		let documentType: FileDocumentType = 'PDF'
		let fileId: string = '1';
		let documentName: string = 'Example Document';

		let sqlString: string = `
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
			`

			// TODO: put newly created entries like DocumentPDF on update list after insert -> manual filling of entry
	}

	private isDatabaseEmpty(): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			console.log('Checking tables in database...');

			// get all table names
			this.database.all('SELECT name FROM sqlite_master WHERE type="table"'/*' AND name="' + this.documentTableName + '"'*/, (done: sqlite3.Statement, result: any[]) => {

				let returnValue: boolean | Error;

				// null is success
				if(done === null) {
					console.log('Checking was executed successfully', done, result.length);
					console.log('Result parameter:', result, 'Count of result:', result.length);

					// table exists
					if(result.length > 0) {
						// check if the database structure is valid
						returnValue = false; // this.isDatabaseStructureValid();
					} else {
						// empty database
						returnValue = true;
						console.log('Database is empty or broken');
					}

					resolve(returnValue);
				} else {
					console.log(done);
					reject(new Error('Could not create or open database!'));
				}
			});
		});
	}

	// TODO:
	private isDatabaseStructureValid(): boolean {
		return false;
	}

	private createNewDatabaseStructure(databaseIsNew: boolean): Promise<boolean> {
		return new Promise<boolean>((resolve, reject) => {
			if(databaseIsNew) {

				console.log('Setting up database structure...');
				this.database.serialize(() => {

					// TODO: create DocumentPlaintext and DocumentImage tables + initialization of Triggers
					// create File table

					this.database.run(`CREATE TABLE "` + this.fileTableName + `" (
									"id" INTEGER NOT NULL PRIMARY KEY UNIQUE,
									"checksum" TEXT NOT NULL UNIQUE,
									"filePath" TEXT NOT NULL UNIQUE,
									"fileType" TEXT NOT NULL,
									"createdOn" TEXT NOT NULL,
									"name" TEXT NOT NULL)`,
					callback => {
						if(callback === null) {
							console.log('Successfully added table', this.fileTableName);
						} else {
							reject(new Error('ERROR: Could not write tables: ' + callback));
						}
					});

					this.database.run(`CREATE TABLE "` + this.documentPdfTableName + `" (
									"id" INTEGER NOT NULL PRIMARY KEY UNIQUE,
									"fileID" INTEGER NOT NULL UNIQUE,
									"name" TEXT NOT NULL,
									FOREIGN KEY (fileID) REFERENCES File(id))`,
					callback => {
						if(callback === null) {
							console.log('Successfully added table', this.documentPdfTableName);
						} else {
							reject(new Error('ERROR: Could not write tables: ' + callback));
						}
					});

					let statement: sqlite3.Statement = this.database.prepare('INSERT INTO ' + this.fileTableName + '(checksum, filePath, fileType, createdOn, name) VALUES (?, ?, ?, ?, ?)');

					for (let i = 0; i < 10; i++) {
						statement.run('Ipsum' + i, '/path/to/fooX' + i, 'PDF', Date.now(), 'Example Document');
					}

					statement.finalize(callback => {
						console.log('Filled table', this.fileTableName);
					});

					let statement2: sqlite3.Statement = this.database.prepare('INSERT INTO ' + this.documentPdfTableName + '(fileID, name) VALUES (?, ?)');

					for (let i = 1; i < 11; i++) {
						statement2.run(i, 'Example Document');
					}

					statement2.finalize(callback => {
						console.log('Filled table', this.documentPdfTableName);
					});

					/*this.database.each('SELECT row AS id, checksum, filePath, fileType, createdOn, name FROM ' + this.fileTableName, (error, row) => {
						console.log(row.id + ': ' + row.checksum + ' ' + row.filePath + ' ' + row.fileType + ' ' + row.createdOn + ' ' + row.name);
					});*/

					// This has to be last in the serialize block!
					console.log('Finished setting up new database');
					resolve(true);
				});
			}
			// this.database.close();
		}
	)};
}