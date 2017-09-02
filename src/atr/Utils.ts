export enum FileDocumentType {
	Pdf = 'PDF',
	Plaintext = 'Plaintext',
	Image = 'Image',
	Unusable = 'Unusable'
}

export type ResolveVoidPromise = (value?: void | PromiseLike<void>) => void;
export type RejectPromise = (reason?: {}) => void;
export type ResolveBooleanPromise = (value?: boolean | PromiseLike<boolean>) => void;
export type ResolveStringPromise = (value?: string | PromiseLike<string>) => void;

export type MulterStorageFilenameCallback = (error: Error, filename: string) => void;

export class QueueFile {
	public readonly Path: string;
	public readonly OriginalName: string;
	public readonly TempName: string;
	public readonly DesiredName: string;

	constructor(filePath: string, fileOriginalName: string, fileTempName: string, fileDesiredName: string) {
		this.Path = filePath;
		this.OriginalName = fileOriginalName;
		this.TempName = fileTempName;
		this.DesiredName = fileDesiredName;
	}
}

export interface IDatabaseFileEntry {
	id: string;
	checksum: string;
	filePath: string;
	fileType: string;
	createdOn: string;
	name: string;
	oldFileName: string;
}

export function DeepCopy(object: {}): {} {
	return JSON.parse(JSON.stringify(object));
}
