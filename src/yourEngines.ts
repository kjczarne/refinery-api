import { BaseEngine } from 'refinery-core';
import { FakeEngine } from 'fake-engine';

export let YourEngines = new Array<typeof BaseEngine>();

YourEngines.push(
    FakeEngine
);

export default YourEngines