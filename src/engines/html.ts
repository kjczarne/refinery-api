import BaseEngine from './baseEngine';
import { IRecord } from '../interfaces';
import { HtmlConvSpec } from '../conversionSpecs';
import { Record } from '../record';


export class HtmlHandler extends BaseEngine {
    /**
     * @function convertToHtml Converts IRecords to an HTML document
     * serialized string.
     * @param record IRecord or an Array of IRecord Objects
     * @param title Desired title of the HTML Document
     * @param cssFile CSS file for styling
     * @param cssDataField1Class CSS class bound to Highlight elements
     * @param cssDataField2Class CSS class bound to Note elements
     * @param cssTitleClass CSS class bound to the title
     * @returns string
     */
    convertToHtml(
        record: IRecord | Array<IRecord>,
        title: string,
        cssFile: string = 'default.css',
        cssDataField1Class: string = 'highlight',
        cssDataField2Class: string = 'note',
        cssTitleClass: string = 'title'
    ): string {
        let htmlCore: string = HtmlConvSpec.PRE(title, cssFile);
        htmlCore += Record.convert(
            record, 
            title,
            HtmlConvSpec.WRAP_TITLE(cssTitleClass),
            HtmlConvSpec.WRAP_DATA(cssDataField1Class, cssDataField2Class));
        htmlCore += HtmlConvSpec.TRAIL();
        return htmlCore;
    }
}