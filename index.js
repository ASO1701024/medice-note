const path = require('path');
const Koa = require('koa');
const server = require('koa-static');
const render = require('koa-ejs');
const bodyParser = require('koa-bodyparser');
const session = require('koa-generic-session');
const SQLite3Store = require('koa-sqlite3-session');

const app = new Koa();
render(app, {
    root: path.join(__dirname, 'view'),
    layout: 'base',
    viewExt: 'ejs',
    cache: false,
    debug: false
});
app.use(server('./public'));
app.use(bodyParser());
app.keys = ['SECRET_KEY'];
app.use(session({
    store: new SQLite3Store('session.db', {}),
    maxAge: 1000 * 60 * 60 * 24,
    secure: false
}, app));

const indexRouter = require('./router/index');
app.use(indexRouter.routes());
app.use(indexRouter.allowedMethods());

const signupRouter = require('./router/signup');
app.use(signupRouter.routes());
app.use(signupRouter.allowedMethods());

const loginRouter = require('./router/login');
app.use(loginRouter.routes());
app.use(loginRouter.allowedMethods());

const logoutRouter = require('./router/logout');
app.use(logoutRouter.routes());
app.use(logoutRouter.allowedMethods());

const authMailRouter = require('./router/auth-mail');
app.use(authMailRouter.routes());
app.use(authMailRouter.allowedMethods());

const forgotPasswordRouter = require('./router/forgot-password');
app.use(forgotPasswordRouter.routes());
app.use(forgotPasswordRouter.allowedMethods());

const authPasswordRouter = require('./router/auth-password');
app.use(authPasswordRouter.routes());
app.use(authPasswordRouter.allowedMethods());

const contactRouter = require('./router/contact');
app.use(contactRouter.routes());
app.use(authPasswordRouter.allowedMethods());


const testMedicineRegisterRouter = require('./router/medicine-register');
app.use(testMedicineRegisterRouter.routes());
app.use(testMedicineRegisterRouter.allowedMethods());

const testMedicineUpdateRouter = require('./router/medicine-update');
app.use(testMedicineUpdateRouter.routes());
app.use(testMedicineUpdateRouter.allowedMethods());

app.listen(5000);