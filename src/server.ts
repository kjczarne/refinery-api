import express from 'express';
import bodyParser from 'body-parser';
import passport from 'passport';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import { Strategy } from 'passport-local';
import flash from 'connect-flash';
import { logger } from './utils';
import fetch from 'node-fetch';
import { config as cfg } from './configProvider';
import { RefineryDatabaseWrapper } from './engine';
import ApiController from './controllers/apiController';
import cors from 'cors';
import fileUpload from 'express-fileupload';
import { ExpectedParametersIngress, ExpectedParametersEgress} from './controllers/interfaces';

const config = cfg();
const dbName = config.refinery.database.databaseName;
const dbServer = config.refinery.database.databaseServer;
const [protocol, rest] = dbServer.split('//');
const url = (username: string, password: string) => 
  `${protocol}//${username}:${password}@${rest}${dbName}`;


const app = express()
const port = process.env.REFINERY_SERVER_PORT || 6969
const secret = process.env.REFINERY_SECRET || "none"
if (secret === "none") {
  throw new Error("Set the REFINERY_SECRET env variable first!");
}

app.use(fileUpload({ createParentPath: true }));
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
app.use(bodyParser.urlencoded({ extended: true }));
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
app.get(`/doc/:docId`, async (req: any, res) => {
  // request: document ID, response: document
  let doc = await db?.db.get(req.params.docId);
  res.json(doc);
});

app.get(`/batch/:batch`, async (req: any, res) => {
  // request: batch name, response: all docs in the batch
  let docs = await db?.db.find({ selector: { batch: req.params.batch } });
  res.json(docs);
});

app.get(`/notebook/:notebook`, async (req: any, res) => {
  // request: batch name, response: all docs in the batch
  let docs = await db?.db.find({ selector: { batch: req.params.notebook } });
  res.json(docs);
});

app.get(`/find/:selector`, async (req: any, res) => {
  // request: batch name, response: all docs in the batch
  let docs = await db?.db.find(req.params.selector);
  res.json(docs);
});
// ===================================================================================


// ===================================================================================
// COUCH RELAY METHODS:
// ===================================================================================

app.all(`/couch/:query`,
  async (req: any, res) => {
    let theURL = url(
      req.session.passport.user.id,
      req.session.passport.user.password  // these values are injected by passport.js
    );
    let responseObj = await fetch(
      theURL
    );
    let response = JSON.parse(await responseObj.text());
    res.json(response);
  }
);


// ===================================================================================
// REFINERY IN/OUT METHODS:
// ===================================================================================


// POST methods should always trigger ingress, GET always egress.
// TODO: use multer
// app.post(`/refine/:what`, async function(req, res){
//   let path = await controller?.uploadFiles(req, res, config.loc);
//   if (!req.params.what) {
//     // if format not explicitly stated, send it to the server and warn
//     res.send({
//       "warning": `You haven't specified the file format, saving in: ${config.loc}`
//     });
//   } else {
//     const parameters: Exclude<ExpectedParametersIngress, { config: string }> 
//       & Required<Pick<ExpectedParametersIngress, "resource">> = {
//         what: <any>req.params.what,
//         resource: path || "",
//         batch: req.body.batch,
//         notebook: req.body.notebook
//     }
//     controller?.refineIn(parameters);
//     res.send("Loaded.")
//   }
// });

// TODO: use `sendFile` on GET
// app.get('/refine/:what', async function(req, res){
//   let path = await controller?.uploadFiles(req, res, config.loc);
//   if (!req.params.what) {
//     // if format not explicitly stated, send it to the server and warn
//     res.send({
//       "warning": `You haven't specified the file format, saving in: ${config.loc}`
//     });
//   } else {
//     const parameters: Exclude<ExpectedParametersEgress, { config: string }> = {
//         what: <any>req.params.what,
//         resource: path || "",
//         batch: req.body.batch,
//         notebook: req.body.notebook
//     }
//     controller?.refineOut(parameters);
//   }
// })

// ===================================================================================

app.listen(port, () => {
  console.log(`Refinery started at http://localhost:${port}`)
});