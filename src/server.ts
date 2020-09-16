import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Strategy } from 'passport-local';
import flash from 'connect-flash';
import { logger } from 'refinery-core';
import fetch from 'node-fetch';
import { config as cfg } from 'refinery-core';
import { RefineryDatabaseWrapper } from 'refinery-core';
import ApiController from './controllers/apiController';
import cors from 'cors';
import { ExpectedParametersIngress, ExpectedParametersEgress} from './controllers/interfaces';
import multer from 'multer';

const config = cfg();
const dbName = config.refinery.database.databaseName;
const dbServer = config.refinery.database.databaseServer;
const [protocol, rest] = dbServer.split('//');
const url = (username: string, password: string) => 
  `${protocol}//${username}:${password}@${rest}${dbName}`;


const app = express()
const port = process.env.REFINERY_SERVER_PORT || 42069
const secret = process.env.REFINERY_SECRET || "none"
if (secret === "none") {
  throw new Error("Set the REFINERY_SECRET env variable first!");
}

app.use(cors());
app.use(express.static('public'));
app.use(session({
  secret: secret,
  cookie: {
    // secure: true,
    maxAge: 300000,
  },
  resave: true,
  saveUninitialized: true
}));
app.use(flash());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(passport.initialize());
app.use(passport.session());

type SerializedUserData = {id: string, password: string};

var db: RefineryDatabaseWrapper | undefined = undefined;
var controller: ApiController | undefined = undefined;

async function authCallback(
  username: string, 
  password: string, 
  done: (err: Error | null, userId?: SerializedUserData | boolean) => void
) {
  logger.log({
    level: "info",
    message: `Setting auth URL to: ${url}`
  })
  var responseObj = await fetch(url(username, password));
  var response = JSON.parse(await responseObj.text());
  try {
    if ((<any>response)['db_name'] === dbName) {  
      // expected key error here if user unauthorized;
      // if user authorized, db_name appears in the response,
      // in such case pass the username and password to `done`
      // which can be used to generate a cookie
      // TODO: put db access through controller
      !db ? db = new RefineryDatabaseWrapper(username, password) : db=db;
      !controller ? controller = new ApiController(username, password) : controller=controller;
      return done(null, {id: username, password: password});
    } else {
      return done(new Error("CouchDb database names seem not to agree. Exiting."))
    }
  } catch (err) {
    if ((<any>response)['error'] === "unauthorized") {
      return done(null, false);
    } else {
      return done(err);
    }
  }
}

passport.use(new Strategy(
  authCallback
));

passport.serializeUser(function(user: SerializedUserData, done) {
  done(null, user);
});

passport.deserializeUser(function(user: SerializedUserData, done) {
  authCallback(user.id, user.password, done)
});

// ===================================================================================
// AUTHENTICATION METHODS:
// ===================================================================================

app.post('/login',
  passport.authenticate('local', { 
    failureRedirect: '/loginFailed', 
    failureFlash: true,
    session: true
  }),
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/login',
  function (req, res) {
    res.redirect('/');
  }
);

app.get('/', (req: any, res) => {
  let msg = "Logged in successfully";
  res.send(msg);
});

app.all('/loginFailed', (req: any, res) => {
  let msg = "Failed to log in!";
  res.send(msg);
});

// ===================================================================================

// ===================================================================================
// BASIC CRUD METHODS:
// ===================================================================================
app.get(`/doc`, async (req: any, res) => {
  // request: document ID, response: document
  let doc = await db?.db.get(req.query.docId);
  res.json(doc);
});

app.get(`/batch`, async (req: any, res) => {
  // request: batch name, response: all docs in the batch
  let docs = await db?.db.find({ selector: { batch: req.query.batch } });
  res.json(docs);
});

app.get(`/notebook`, async (req: any, res) => {
  // request: batch name, response: all docs in the batch
  let docs = await db?.db.find({ selector: { batch: req.query.notebook } });
  res.json(docs);
});

app.get(`/find`, async (req: any, res) => {
  // request: batch name, response: all docs in the batch
  let docs = await db?.db.find(req.query.selector);
  res.json(docs);
});
// ===================================================================================


// ===================================================================================
// COUCH RELAY METHODS:
// ===================================================================================

app.all(`/couch`,
  // call this like: /couch?url=/_all_docs
  async (req: any, res) => {
    let theURL = url(
      req.session.passport.user.id,
      req.session.passport.user.password  // these values are injected by passport.js
    );
    console.log(req.query);
    let responseObj = await fetch(
      theURL + req.query.url
    );
    let response = JSON.parse(await responseObj.text());
    res.json(response);
  }
);


// ===================================================================================
// REFINERY IN/OUT METHODS:
// ===================================================================================
// POST methods should always trigger ingress, GET always egress.
const upload = multer({ dest: config.refinery.files.loc });

app.post(`/refine`, upload.single('file'), function(req, res){
  if (!req.query.what) {
    // if format not explicitly stated, send it to the server and warn
    res.send({
      "warning": `You haven't specified the file format, saving in: ${config.files.loc}`
    });
  } else {
    const parameters: Exclude<ExpectedParametersIngress, { config: string }> 
      & Required<Pick<ExpectedParametersIngress, "resource">> = {
        what: <any>req.query.what,
        resource: req.file.path || "",
        batch: req.body.batch,
        notebook: req.body.notebook
    }
    controller?.refineIn(parameters);
    res.send("Loaded.")
  }
  res.status(200)
});

app.get('/refine', async (req: any, res) => {
  var options = {
    root: config.refinery.files.loc,
    dotfiles: 'deny',
    headers: {
      'x-timestamp': Date.now(),
      'x-sent': true
    }
  }
  if (!req.query.what) {
    // if format not explicitly stated, send it to the server and warn
    res.send({
      "error": `You haven't specified the file format you want to obtain.`
    });
  } else {
    const parameters: Exclude<ExpectedParametersEgress, { config: string }> = {
        what: <any>req.query.what,
        path: options.root + '/' + req.query.filename,
        batch: req.query.batch,
        notebook: req.query.notebook,
        diff: req.query.diff,
        flipped: req.query.flipped
    }
    console.log(options.root)
    console.log(parameters.path)
    await controller?.refineOut(parameters);
    res.sendFile(
      req.query.filename,  // this looks for a filename in local files folder (specified in config)
      options, 
      function (err) {
        if (err) {
          let msg = `An error occured: ${err}`
          logger.log({
            level: 'error',
            message: msg
          });
          console.log(msg);
        } else {
          let msg = `Sent: ${req.query.filename}`;
          logger.log({
            level: 'info',
            message: msg
          });
          console.log(msg);
        }
      }
    );
  }
});

// ===================================================================================

app.listen(port, () => {
  console.log(`Refinery started at http://localhost:${port}`)
});