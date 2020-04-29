# Project structure

## Goal

The goal of this project is to provide a simple extractor for annotations stored in EPUB and PDF files and serialization of those annotations into a simple and consistent format.

A major point when designing this that needs to be accounted for is extensibility. A fairly simple and flexible API should be introduced that will let anyone write adapters from other JS-based parsers to support other formats in the future, e.g. MOBI, generic HTML, etc.

The goal of this repo is solely to do the parsing just right and to be pluggable in the sense that it could then be grown out into a full-blown knowledge-management personal-knowledgebase kind of software. On of the early functionalities however that I personally need for this is to be able to convert whatever comes out of this parser to be easily transformed into Anki flashcards. This could be built as an external module. However I would see parsing to Markdown summaries better handled here directly (better code reuse).

You can view this project as a kind of unifying adapter between different frameworks that have different parsing APIs for different formats that will return a standardized annotation collection, both highlighted text and notes and to the best of possibilities also rich contents.

TL;DR in short:

* serialize annotations from EPUB and PDF files from various vendors to a JSON format
* serialize annotations from EPUB and PDF files from various vendors to Markdown summaries of highlights

## Proposed output format

I suggest that the output should be serialized into a JSON format with any rich content saved aside in `assets` folder and mapped back to that JSON. This will let frontend frameworks (which have yet to be built) be able to parse those annotations when needed or the Anki converter to efficiently include rich content when and if possible.

```json
{
    "title_of_the_book": [
        {
            "page_map": {
                "type": "epubcfi",
                "value": ""
            },
            "orig_text": "",    // original text from the publication
            "note": "",         // note from the annotation (empty if just highlight)
            "rich_content": ""  // path to additional assets if parsed
        }
    ]
}
```

Some things can be debated in the aforementioned JSON structure, like the usage of hashed objects instead of an array.