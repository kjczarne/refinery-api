import dedent from 'ts-dedent';

class ConvSpec {
    static PRE: any;
    static WRAP_TITLE: any;
    static WRAP_DF1: any;
    static WRAP_DF2: any;
    static TRAIL: any;
    static MAGIC_MARKER = () => "⚗️";
    static WRAP_FOOTER: any;
}  // LATER: a better way of handling static interfaces

export class HtmlConvSpec extends ConvSpec{
    static PRE = (title: string, cssFile: string): string =>
    dedent`<!DOCTYPE html>\n<html>\n<head>\n  <title>${title}</title>
  <link rel="stylesheet" href="${cssFile}">\n</head>\n<body>\n`;
    
    static WRAP_TITLE = (cssTitleClass: string = "none"): [string, string] => 
        [`  <h1 class="${cssTitleClass}">`, "</h1>\n"];

    static WRAP_DF1 = (cssDataField1Class: string = "none"): [string, string] => 
        [`    <p class="${cssDataField1Class}">`, "</p>\n"];

    static WRAP_DF2 = (cssDataField2Class: string = "none"): [string, string] =>
        [`    <p class="${cssDataField2Class}">`, "</p>\n\n"];

    static TRAIL = () => "</body></html>";

}

export class MdConvSpec extends ConvSpec {
    static PRE = () => ""
    static WRAP_TITLE = (): [string, string] => ["# ", ` ${MdConvSpec.MAGIC_MARKER()}\n\n`]
    static WRAP_DF1 = (): [string, string] => ["- ", "\n\n"]
    static WRAP_DF2 = (): [string, string] => ["    ", "\n\n"]
    static WRAP_FOOTER = (): [string, string] => ["", `${MdConvSpec.MAGIC_MARKER()}\n`]
    static MINIMUM_CHARACTERS = 4;  // minimum chars per field to treat as sth to be parsed
}