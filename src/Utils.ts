export type FileDocumentType = 'PDF' | 'Image' | 'Plaintext';

export type ResolveVoidPromise = (value?: void | PromiseLike<void>) => void;
export type RejectPromise = (reason?: {}) => void;
export type ResolveBooleanPromise = (value?: boolean | PromiseLike<boolean>) => void;
export type ResolveStringPromise = (value?: string | PromiseLike<string>) => void;

export type MulterStorageFilenameCallback = (error: Error, filename: string) => void;
