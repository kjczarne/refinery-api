# Testing strategy

## Unit tests

Unit tests are be provided in `mocha` framework with `ts-node` runtime to simplify the workflow and not have to compile manually each time tests are being run.

Tests are be separated from the original repo and provided as a submodule and can be obtained by cloning recursively.

Tests should be written upfront and kept up to date all the time to foster TDD practices. You'll see however that the coverage is not very impressive since this project is still in its infancy.

In case of problems with `mocha`, refer to the following article: https://journal.artfuldev.com/unit-testing-node-applications-with-typescript-using-mocha-and-chai-384ef05f32b2 
