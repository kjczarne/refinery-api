# Refinery

![logo.png](./doc/RefineryLogo.png)

Simple information snippet processor. Extracts information from e.g. E-Books and puts them into a self-managed CouchDb instance. On demand, records stored in the self-hosted database can be serialized to various formats like Markdown or Flashcards.

## Status

This project is in early stages of development.

### What woks

* iBooks annotation and notes extraction
* conversion to AnDev Flashcards CSV
* conversion to Markdown summaries

### Egress and Ingress adapters' comparison

Various adapters (handlers/engines) are available but not all of them are bidirectional, e.g. it makes little sense to convert extracted e-book highlights back into iBooks.

| Adapter name      | Egress available | Ingress available      | `--what` |
|-------------------|------------------|------------------------|----------|
| AnDev Flashcards  | **Yes**          | In development         | `andev`  |
| Anki Flashcards   | In development   | In development         | n/a      |
| Apple iBooks      | No               | **Yes** (macOS sqlite) | n/a      |
| Audible           | No               | Planned for future     | n/a      |
| JSON              | In development   | In development         | n/a      |
| Markdown          | **Yes**          | **Yes**                | `md`     |
| Notion            | In development   | In development         | n/a      |

### Plans for the future

* direct HTML highlighting and notetaking with egress handler
* mobile front-end for easy manual record creation

## How to use

1. Deploy a CouchDb instance (recommended Docker image for deployment speed)
2. Expose the CouchDb instance credentials through the `configuration/.refinery.yaml`. Right now this is a plaintext file which isn't encrypted and a **very insecure** way of handling credentials but until a stable release appears this is the simplest way of injecting credentials into the Node app.
3. Use `refinery-in` for ingress and `refinery-out` for egress, e.g. `refinery-out --what=md --path=temp.md --set=default --notebook=default` -> converts the `default` batch of records belonging to the `default` notebook to a Markdown file called `temp.md`.

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