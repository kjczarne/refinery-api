# Technology stack

## Why Node.JS?

Development with Node is relatively lightweight and flexible enough for what we're trying to acheive. On top of that there is a great advantage of having unity in implementation language between the back-end and front-end, which is planned to be a React.JS/React Native application.

## Why TypeScript?

We like JavaScript but we like TypeScript way more. Static typing catches an enormous number of bugs in code before compilation even happens, lets you manipulate compatibility with target ECMAScript standards and even more importantly allows us to define flexible, yet unambiguous interfaces of JavaScript Objects that will be passed around, which defines a contract that must be fulfilled by any additional adapter added to the project.

## Database choice

Refinery extracts information from one place and lets you rework it into something else primarily for learning. It acheives that by means of keeping a database of the extracted `IRecord` objects as defined in the top-level `interfaces.ts` file. 

Our choice for a database is Apache CouchDB. We choose CouchDB for its high reliability, querying natively through HTTP, support for distributed computing and top-notch availability (no downtime policy). In terms of the CAP theorem this is an AP system which is *eventually consistent*. CouchDB can be easily scaled and if in the future the number of records increases greatly, it's possible to use distributed map-reduce-based computing paradigm.

By design our CouchDB is decoupled from the project itself but it's eventually necessary to allow data transfer between two mediums.

## Logging

`winston` is our logger of choice as it's very simple to implement and very comprehensive when reading code. Read DEBUGGING.md to learn how to use it. We do not currently pass logs around to any sort of messaging broker but we see that as a possibility as we scale this project.