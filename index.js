const path = require('path');
const Koa = require('koa');
const server = require('koa-static');
const render = require('koa-ejs');
const bodyParser = require('koa-bodyparser');
const { v4: uuid } = require('uuid');

const app = new Koa();
render(app, {
    root: path.join(__dirname, 'view'),
    layout: 'base',
    viewExt: 'html',
    cache: false,
    debug: true
});
app.use(server('./public'));
app.use(bodyParser());

// uuid().split('-').join('')

const indexRouter = require('./router/index');
app.use(indexRouter.routes())
app.use(indexRouter.allowedMethods())

app.listen(5000);