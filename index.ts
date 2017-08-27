import fs = require('fs');
import { Server } from './src/Server';
import { ClearanceManager } from './src/workers/ClearanceManager'
import { DatabaseManager } from "./src/workers/DatabaseManager";
import { FileManager } from "./src/workers/FileManager";
import { DocumentManager } from "./src/workers/DocumentManager";

let restService: Server = new Server('3000');
let clearanceManager: ClearanceManager = ClearanceManager.getInstance();
let databaseManager: DatabaseManager = DatabaseManager.getInstance();
let fileManager: FileManager = FileManager.getInstance();
let documentManager: DocumentManager = DocumentManager.getInstance();
