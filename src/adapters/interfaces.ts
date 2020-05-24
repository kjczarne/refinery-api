export type iBooks2RefineryFunction = (
    bookName: string
) => void

export type iBooks2AnkiFunction = (
    bookName: string,
    deckName: string, 
    apkgPath?: string
) => void