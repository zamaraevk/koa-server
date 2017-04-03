const Koa = require('koa');
const Router = require('koa-router');
const session = require('koa-session');
const auth = require('koa-basic-auth');
const logger = require('koa-logger')

const app = new Koa();
const router = new Router();

app.keys = ['Shh, its a secret!'];

//This is what the authentication would be checked against
const credentials = { name: 'Ayush', pass: 'India' }

router.get('/users/:user', async (ctx) => {
  try {
    ctx.body = `Hello, ${ctx.params.user}!\n`;
    ctx.cookies.set('foo', 'bar', {httpOnly: false});
    console.log('Cookies: foo = ', ctx.cookies.get('foo'));
    //ctx.throw('Error Message', 500);
  }
  catch (error) {
    console.log("Errrrrrr", error.message);
    ctx.body = error.message;
  }
});

router.get('/not-found', async (ctx) => {
  try {
    ctx.status = 404;
    ctx.body = 'Sorry we do not have this resource.';
  }
  catch (error) {
    console.log(error.message);
    ctx.body = error.message;
  }
});

// Set up authentication here as first middleware. This returns an error if user is not authenticated.
router.get('/protected', auth(credentials), async (ctx, next) => {
  ctx.body = 'You have access to the protected area.';
  await next();
});

// No authentication middleware present here.
router.get('/unprotected', async (ctx, next) => {
  ctx.body = 'Anyone can access this area';
  await next();
});

// x-response-time

app.use(async function (ctx, next) {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  ctx.set('X-Response-Time', `${ms}ms`);
});

// logger

app.use(async function (ctx, next) {
  const start = new Date();
  await next();
  const ms = new Date() - start;
  console.log(`${ctx.method} ${ctx.url} - ${ms}`);
});

app
  .use(logger())
  .use(router.routes())
  .use(router.allowedMethods())
  .use(session(app))
  // .use(async function (ctx) {
  //   let n = ctx.session.views || 0;
  //   ctx.session.views = ++n;
  //   if(n === 1)
  //     ctx.body = 'Welcome here for the first time!';
  //   else
  //     ctx.body = "You've visited this page " + n + " times!";
  // })
  .use(async function (ctx, next) {
    try {
     await next();
   } catch (err) {
     if (401 == err.status) {
       ctx.status = 401;
       ctx.set('WWW-Authenticate', 'Basic');
       ctx.body = 'You have no access here';
     } else {
       throw err;
     }
   }
  })
  .use(async function (ctx, next) {
    if (404 !== ctx.status) return;
    ctx.redirect('/not-found');
  })

app.listen(3030, function () {
  console.log("Server 3030!");
});
