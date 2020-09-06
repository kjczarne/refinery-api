#!/usr/bin/env node
// use process.parameters here, first two args are the node command elements (node, script path)
import relayEgress from '../relays/egressRelay';
import relayIngress from '../relays/ingressRelay';
import AndevEngine from '../engines/andevFlashcards';
import MdEngine from '../engines/markdown';
import JsonEngine from '../engines/json';
import { DEFAULT_CONFIG_PATH } from '../configProvider';
import BaseEngine from '../engines/baseEngine';
import { ExpectedParametersEgress, ExpectedParametersIngress } from './interfaces';
import { AppleiBooksEngine } from '../engines/iBooks';

export class ApiController {

  private _username: string | undefined;
  private _password: string | undefined;

  constructor(username?: string, password?: string) {
    this._username = username;
    this._password = password;
  }

  async uploadFiles(req: any, res: any, destination: string) {
    try {
      if(!req.files) {
        res.send({
            status: false,
            message: 'No file uploaded'
        });
      } else {
        //Use the name of the input field (i.e. "file") to retrieve the uploaded file
        let file = req.files.file;
        
        //Use the mv() method to place the file in upload directory (i.e. "uploads")
        let path = destination + '/' + file.name;
        file.mv(path);

        //send response
        res.send({
          status: true,
          message: 'File is uploaded',
          data: {
              name: file.name,
              mimetype: file.mimetype,
              size: file.size
          }
        });
        return path;
      }
    } catch (err) {
      res.status(500).send(err);
    }
  }

  // config assumed to be specified on deployment of the server
  // or default used; no reconfiguration possibility from
  // client's level

  relayClosureEgress(
    engine: BaseEngine,
    parameters: Exclude<ExpectedParametersEgress, { config: string }>
  ) {
    relayEgress(
      engine,
      parameters.path,
      parameters.batch,
      parameters.notebook,
      parameters.diff,
      parameters.flipped
    );
  }

  relayClosureIngress(
    engine: BaseEngine,
    parameters: Exclude<ExpectedParametersIngress, { config: string }> 
      & Required<Pick<ExpectedParametersIngress, "resource">>
  ) {
    relayIngress(
      engine,
      parameters.resource,
      parameters.batch,
      parameters.notebook
    );
  }

  refineIn(parameters: Exclude<ExpectedParametersIngress, { config: string }> 
    & Required<Pick<ExpectedParametersIngress, "resource">>) {
      switch (parameters.what) {
        case 'ibooks': {
          this.relayClosureIngress(
            new AppleiBooksEngine(
              this._username,  // TODO: reduce code duplication here
              this._password
            ),
            parameters
          )
        }
        case 'md': {
          this.relayClosureIngress(
            new MdEngine(
              this._username,
              this._password
            ),
            parameters
          )
        }
      }
    }
  
  refineOut(parameters: Exclude<ExpectedParametersEgress, { config: string }>) {
    switch (parameters.what) {
      case 'andev':
        this.relayClosureEgress(
          new AndevEngine(
            this._username,
            this._password
          ),
          parameters
        );
      case 'md': {
        this.relayClosureEgress(
          new MdEngine(
            this._username,
            this._password
          ),
          parameters
        )
      }
      case 'json': {
        this.relayClosureEgress(
          new JsonEngine(
            this._username,
            this._password
          ),
          parameters
        )
      }
    }
  }
}

export default ApiController;

