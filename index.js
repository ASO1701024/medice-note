const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const server = require('koa-static');
const render = require('koa-ejs');
const koaBody = require('koa-body');
const session = require('koa-generic-session');
const SQLite3Store = require('koa-sqlite3-session');

let uploadCache = path.join(__dirname, '/upload_cache')
if (!fs.existsSync(uploadCache)) {
    fs.mkdir(uploadCache, () => { });
}

let uploadFolder = path.join(__dirname, '/public/upload')
if (!fs.existsSync(uploadFolder)) {
    fs.mkdir(uploadFolder, () => { });
}

const app = new Koa();
render(app, {
    root: path.join(__dirname, 'view'),
    layout: 'base',
    viewExt: 'ejs',
    cache: false,
    debug: false
});
app.use(server('./public'));
app.use(koaBody({
    multipart: true,
    formidable: {
        uploadDir: path.join(__dirname, '/upload_cache'),
        keepExtensions: true
    }
}));
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
app.use(contactRouter.allowedMethods());

const medicineRegisterRouter = require('./router/medicine-register');
app.use(medicineRegisterRouter.routes());
app.use(medicineRegisterRouter.allowedMethods());

const medicineUpdateRouter = require('./router/medicine-update');
app.use(medicineUpdateRouter.routes());
app.use(medicineUpdateRouter.allowedMethods());

const medicineDeleteRouter = require('./router/medicine-delete');
app.use(medicineDeleteRouter.routes());
app.use(medicineDeleteRouter.allowedMethods());

const accountSetting = require('./router/account-setting');
app.use(accountSetting.routes());
app.use(accountSetting.allowedMethods());

const accountEdit = require('./router/account-edit');
app.use(accountEdit.routes());
app.use(accountEdit.allowedMethods());

app.listen(5000);