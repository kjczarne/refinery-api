# Refinery.JS

Simple information snippet processor. Extracts information from e.g. E-Books and puts them into a self-managed CouchDb instance. On demand, records stored in the self-hosted database can be serialized to various formats like Markdown or Flashcards.

## Status

This project is in early stages of development.

### What woks

* iBooks annotation and notes extraction
* conversion to AnDev Flashcards CSV
* conversion to Markdown summaries

### Egress and Ingress adapters' comparison

Various adapters (handlers/engines) are available but not all of them are bidirectional, e.g. it makes little sense to convert extracted e-book highlights back into iBooks.

| Adapter name      | Egress available | Ingress available  | `--what` |
|-------------------|------------------|--------------------|----------|
| AnDev Flashcards  | Yes              | In development     | `andev`  |
| Anki Flashcards   | In development   | In development     | n/a      |
| Apple iBooks      | No               | Yes (macOS sqlite) | n/a      |
| Audible           | No               | Planned for future | n/a      |
| JSON              | Yes              | In development     | n/a      |
| Markdown          | Yes              | In development     | `md`     |
| Notion            | In development   | In development     | n/a      |

### Plans for the future

* direct HTML highlighting and notetaking with egress handler
* mobile front-end for easy manual record creation

## How to use

1. Deploy a CouchDb instance (recommended Docker image for deployment speed)
2. Expose the CouchDb instance credentials through the `configuration/.refinery.yaml`. Right now this is a plaintext file which isn't encrypted and a **very insecure** way of handling credentials but until a stable release appears this is the simplest way of injecting credentials into the Node app.
3. Use `npm run in` for ingress and `npm run out` for egress, e.g. `npm run out -- --what=md --path=temp.md --set=default --notebook=default` -> converts the `default` set of records belonging to the `default` notebook to a Markdown file called `temp.md`.