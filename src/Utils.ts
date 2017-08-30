export type FileDocumentType = 'PDF' | 'Image' | 'Plaintext';

export type ResolveVoidPromise = (value?: void | PromiseLike<void>) => void;
export type RejectPromise = (reason?: {}) => void;
export type ResolveBooleanPromise = (value?: boolean | PromiseLike<boolean>) => void;
export type ResolveStringPromise = (value?: string | PromiseLike<string>) => void;

export type MulterStorageFilenameCallback = (error: Error, filename: string) => void;

export class QueueFile {
	public readonly FilePath: string;
	public readonly FileOriginalName: string;
	public readonly FileTempName: string;
	public readonly FileDesiredName: string;

	constructor(filePath: string, fileOriginalName: string, fileTempName: string, fileDesiredName: string) {
		this.FilePath = filePath;
		this.FileOriginalName = fileOriginalName;
		this.FileTempName = fileTempName;
		this.FileDesiredName = fileDesiredName;
	}
}
