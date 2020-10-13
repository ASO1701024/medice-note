const path = require('path');
const fs = require('fs');
const Koa = require('koa');
const server = require('koa-static');
const render = require('koa-ejs');
const koaBody = require('koa-body');
const session = require('koa-generic-session');
const SQLite3Store = require('koa-sqlite3-session');
const json = require('koa-json')
const config = require('./config.json');

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
app.use(json({
    pretty: true
}));
app.keys = config.session.key;
app.use(session({
    store: new SQLite3Store(config.session.filename, {}),
    maxAge: 1000 * 60 * 60 * 24,
    secure: false
}, app));
app.proxy = true;

// Cron
require('./app/cron-push-message');
require('./app/cron-verify-line-access-token');
require('./app/cron-delete-user');

const indexRouter = require('./router/index');
app.use(indexRouter.routes());
app.use(indexRouter.allowedMethods());

// Account
const signupRouter = require('./router/signup');
app.use(signupRouter.routes());
app.use(signupRouter.allowedMethods());

const loginRouter = require('./router/login');
app.use(loginRouter.routes());
app.use(loginRouter.allowedMethods());

const twoFactorAuthenticationRouter = require('./router/two-factor-authentication');
app.use(twoFactorAuthenticationRouter.routes());
app.use(twoFactorAuthenticationRouter.allowedMethods());

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

const renewMailAuthRouter = require('./router/renew-mail-auth');
app.use(renewMailAuthRouter.routes());
app.use(renewMailAuthRouter.allowedMethods());

const contactRouter = require('./router/contact');
app.use(contactRouter.routes());
app.use(contactRouter.allowedMethods());

// Medicine
const medicineRouter = require('./router/medicine');
app.use(medicineRouter.routes());
app.use(medicineRouter.allowedMethods());

const medicineRegisterRouter = require('./router/medicine-register');
app.use(medicineRegisterRouter.routes());
app.use(medicineRegisterRouter.allowedMethods());

const medicineUpdateRouter = require('./router/medicine-update');
app.use(medicineUpdateRouter.routes());
app.use(medicineUpdateRouter.allowedMethods());

const medicineDeleteRouter = require('./router/medicine-delete');
app.use(medicineDeleteRouter.routes());
app.use(medicineDeleteRouter.allowedMethods());

const calenderRouter = require('./router/medicine-calendar');
app.use(calenderRouter.routes());
app.use(calenderRouter.allowedMethods());

// Group
const groupListRouter = require('./router/group-list');
app.use(groupListRouter.routes());
app.use(groupListRouter.allowedMethods());

const groupRouter = require('./router/group');
app.use(groupRouter.routes());
app.use(groupRouter.allowedMethods());

// Notice
const noticeListRouter = require('./router/notice-list');
app.use(noticeListRouter.routes());
app.use(noticeListRouter.allowedMethods());

const noticeRegisterRouter = require('./router/notice-register');
app.use(noticeRegisterRouter.routes());
app.use(noticeRegisterRouter.allowedMethods());

const noticeUpdateRouter = require('./router/notice-update');
app.use(noticeUpdateRouter.routes());
app.use(noticeUpdateRouter.allowedMethods());

// Setting
const accountSettingRouter = require('./router/account-setting');
app.use(accountSettingRouter.routes());
app.use(accountSettingRouter.allowedMethods());

const accountEditRouter = require('./router/account-edit');
app.use(accountEditRouter.routes());
app.use(accountEditRouter.allowedMethods());

const accountDeleteRouter = require('./router/account-delete');
app.use(accountDeleteRouter.routes());
app.use(accountDeleteRouter.allowedMethods());

const lineLoginRouter = require('./router/line-login');
app.use(lineLoginRouter.routes());
app.use(lineLoginRouter.allowedMethods());

// API
const apiCalenderRouter = require('./router/api-calendar');
app.use(apiCalenderRouter.routes());
app.use(apiCalenderRouter.allowedMethods());

app.listen(5000);
