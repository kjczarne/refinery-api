# Testing strategy

## Unit tests

Unit tests will be provided in `mocha` framework with `ts-node` runtime to simplify the workflow and not have to compile manually each time tests are being run.

Tests will be separated from the original repo and provided as a submodule.

Tests should be written upfront and kept up to date all the time to foster TDD practices.

In case of problems with `mocha`, refer to the following article: https://journal.artfuldev.com/unit-testing-node-applications-with-typescript-using-mocha-and-chai-384ef05f32b2 

## CI/CD

In all likelihood the CI pipeline will be implemented in Jenkins-on-Docker using the `4oh4/jenkins_docker` image with a Dockerfile providing general runtime dependencies for the project and Jenkins just governing the tests. No setup overhead on Jenkins, no setup/teardown overhead on testing environment.