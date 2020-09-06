import { logger } from '../utils';
import BaseEngine from '../engines/baseEngine';

let f = (
  engine: BaseEngine,
  resource: string,
  batch?: string,
  notebook?: string
) => {
  engine.load(resource, batch, notebook).then(() => {
    logger.log({
      level: 'info',
      message: `${resource} loaded from ${BaseEngine.descriptor} to Refinery Database.`
    });
  }).catch((err) => {
    logger.log({
      level: 'error',
      message: `${resource} load failed from ${BaseEngine.descriptor}: ${err}`
    })
  });
}

export default f;