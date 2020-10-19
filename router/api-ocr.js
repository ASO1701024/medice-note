const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const ocr = require('../app/ocr');
const vision = require('@google-cloud/vision');
const path = require('path');

router.get('/api/ocr', async (ctx) => {
    // let session = ctx.session;
    //
    // let authKey = session.auth_id;
    // let userId = await app.getUserId(authKey);
    // if (!userId) {
    //     return ctx.body = {};
    // }

    let client = new vision.ImageAnnotatorClient();
    let [result] = await client.textDetection(path.join(__dirname, '../upload_cache/sample01.jpg'));
    let detections = result.fullTextAnnotation.text;
    console.log(detections);
    let parse = ocr.getOCRText(detections);
    console.log(parse);
})

module.exports = router;
