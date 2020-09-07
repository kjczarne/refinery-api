# Refinery

<img src="./doc/RefineryLogo.png" alt="logo" width="100">

Simple information snippet processor. Extracts information from e.g. E-Books and puts them into a self-managed CouchDb instance. On demand, records stored in the self-hosted database can be serialized to various formats like Markdown or Flashcards.

## Status

This project is still pretty fresh, expect bugs and don't hesitate to open up issues.

## The idea

The core idea relies on the concept of flashcards and plays nicely into apps that support spaced-repetition revisions. For many of these you will either have to rely on pre-prepared decks or spend a lot of time manually putting together a file that can be later read by your flashcards app. Imagine how nice it would have been if you could just link your iBooks database with an ebook you're reading and automatically transform your highlights and notes to be automatically transformed to something your flashcards app understands.

To go through with this, the simplest is to define two data fields in a data model that will be dynamic analogues of the front and back face of a flashcard. Maybe add a third field to supply additional note. In most cases that is all you need. In some other cases you might want to attach a file to the record, like an audio recording. There are many degrees of freedom and a lot of room to play, but the most basic model relies on a pair of text fields. That's where Refinery is right now but will certainly not stop there.

At the core, each such pair of text fields is transformed into a slightly more elaborate JSON representation which ends up in a CouchDB instance. You'll need your own CouchDB served for that and using Refinery without it is currently not possible. Why? The goal is to centralize every bit of information in a common database so you don't have to search through your files and resources, instead you know from the get go that if it ever got extracted, it will probably be in the database. The JSON doc looks like this:

```json
{
  "dataField1": "string",
  "dataField2": "string",
  "source": "string",
  "_id": "string",
  "_rev": "string",
  "timestampCreated": 12345679,
  "timestampModified": 12345679,
  "pastExports": [12345678, 12345679],
  "notebook": "string",
  "batch": "string",
  "note": "string"
}
```

Fields `notebook`, `note` and `_rev` are optional. `_rev` is a document version tag used by CouchDb. `note` is an optional third field that contains extra textual information decoupled from the actual flashcard. The fields that contain the paired flashcard data are `dataField1` and `dataField2`.

You have two levels of hierarchy in the docs: `batch` and `notebook`. `batch` is obligatory on the interface but usually when you don't provide a `batch` parameter when sending anything through Refinery to the database, it will simply set `batch` to `true`.

The remaining fields help out with stuff like filtering. Say you want to select only the documents created yesterday. You use a selector when sending a query to the CouchDB that discriminates against the `timestampCreated` field. The `pastExports` array records all the export events that have taken place, so that you can figure out what diff value to use to e.g. filter only new flashcards in the deck you've exported a few days ago.

To learn what conversion schemes are currently supported, always look at the *Conversion Matrix* section below.

To learn how to deploy this project and start using it, scroll down to the *How to use* section.

### What woks

* iBooks annotation and notes extraction (local on `macOS`)
* conversion to AnDev Flashcards CSV
* conversion to Markdown summaries
* basic REST API for a self-deployed server (can receive and send files)

### Conversion Matrix

Various adapters (handlers/engines) are available but not all of them are bidirectional, e.g. it makes little sense to convert extracted e-book highlights back into iBooks.

| Adapter name      | Egress available   | Ingress available      | `--what` |
|-------------------|--------------------|------------------------|----------|
| AnDev Flashcards  | **Yes**            | In development         | `andev`  |
| Anki Flashcards   | In development     | In development         | n/a      |
| Apple iBooks      | No                 | **Yes** (macOS sqlite) | n/a      |
| Audible           | No                 | Planned for future     | n/a      |
| JSON              | **Yes**            | **Yes**                | `json`   |
| Markdown          | **Yes**            | **Yes**                | `md`     |
| Notion            | Planned for future | Planned for future     | n/a      |

## How to use

### Prepare

1. Deploy a CouchDb instance (recommended Docker image for deployment speed). If you care a lot about time and know a bit Docker, use [Refinery Deploy](https://github.com/kjczarne/refinery-deploy).
2. Set the following environment variables:
    * `REFINERY_USER` -> username, same as for your CouchDb
    * `REFINERY_PASSWORD` -> password, same as for your CouchDb
    It's recommended that you set these variables each time you use a terminal session and not keep them in any dotfiles.
3. Install this using `npm i -g .` when in the cloned repo's folder.
4. Use the `./configuration/.refinery.yaml` file to set up:
    ```yaml
    refinery:
      database:
        databaseServer: 'http://localhost:5984/'
        databaseName: 'lorem'
    files:
      loc: './localFiles'
    ibooks:
      annotationsDb: "./tests/res/ibooks/ibooks_db_mock.sqlite"
      libraryDb: "./tests/res/ibooks/ibooks_library_mock.sqlite"
    ```
    You need to provide a URL to a running CouchDB instance and a database name where the docs will be stored. Don't worry if the DB doesn't exist, Couch will create it if it's not there. You may also want to adjust the path to your `iBooks` sqlite database if you're on `macOS` and intend to use the iBooks highlights extraction functionality.

### Use as a CLI tool

Use `refinery-in` for ingress and `refinery-out` for egress, e.g. `refinery-out --what=md --path=temp.md --set=default --notebook=default` -> converts the `default` batch of records belonging to the `default` notebook to a Markdown file called `temp.md`.

### Use as a self-hosted server

1. Set `REFINERY_SECRET` environment variable to any safe string. This will be used by the server to create a cookie session.
2. Optional: set `REFINERY_SERVER_PORT`. If this is not set the server will be available by default on port `42069`.
3. To run the server use `refinery-serve` command. This spins up an Express.JS instance.

### Loading in Markdown Files

As of now, the most stable offering is the Markdown Ingress/Egress. Ingress will scan a Markdown file for an alembic emoji (⚗️) which should be placed right after the title of the section where you keep your paired *flashcards* and another one at the end of the section. For example:

```md
# UI design patterns ⚗️

- What is an MVC pattern?

    Model-View-Controller: user sees the View → interacts with Controller → Controller changes the Model state → Model updates the View for the user. Example framework: Angular

- What is an MVVM pattern?

    Model-View-ViewModel: separates the GUI from the underlying model through a ViewModel which binds to the View through some commands and data binder. In Xamarin, e.g. a XAML file specifies the View and how ViewModel binds to it. Treat ViewModel as a state layer that is available to the View layer. There's no refresh cycle on state update because the View layer has direct access to required properties on ViewModel. Example framework: Xamarin

- What is an MVA pattern?

    Model-View-Adapter: like MVC but Model is decoupled from the View and there's an Adapter mediating between the two. This is used when we want to prevent UI state changes from affecting data handling in the model directly. 
⚗️
```

The pattern of bullet lists starting with dashes and indented answer blocks is for now obligatory to use but in the near future you'll have the possibility of defining your own specification on how to parse and dump the MD files. The current spec is the exact format that Notion dumps its toggle lists in, so you can already use MD files exported from Notion until the native API gets released and lets me play around the topics of sync and smarter format handling.

## Plans for the future

* direct HTML highlighting and notetaking with egress handler
* mobile front-end for easy manual record creation
* ~~REST API for easy interfacing with the front end app~~ ✅
* flexible specification, e.g. provide own regex pattern to parse MD files
* user-defined plugins
