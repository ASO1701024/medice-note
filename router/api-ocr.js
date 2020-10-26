const Router = require('koa-router');
const router = new Router();
const app = require('../app/app');
const ocr = require('../app/ocr');
const vision = require('@google-cloud/vision');
const fs = require('fs');

router.post('/api/ocr', async (ctx) => {
    let session = ctx.session;

    let authKey = session.auth_id;
    let userId = await app.getUserId(authKey);
    if (!userId) {
        return ctx.body = {};
    }

    let image;

    try {
        image = ctx.request.files['image'];
    } catch (e) {
        return ctx.body = {};
    }

    if (image['size'] === 0) {
        fs.unlinkSync(image.path);
        return ctx.body = {};
    }

    switch (app.getExt(image['name'])) {
        case 'jpeg':
        case 'jpg':
        case 'png':
            break;
        default:
            fs.unlinkSync(image.path);
            return ctx.body = {};
    }

    let client = new vision.ImageAnnotatorClient();
    let [result] = await client.textDetection(image.path);
    if (result.fullTextAnnotation === null || result.fullTextAnnotation === undefined) {
        fs.unlinkSync(image.path);
        return ctx.body = {};
    }
    let detections = result.fullTextAnnotation.text;
    let parse = ocr.getOCRText(detections);

    fs.unlinkSync(image.path);
    return ctx.body = {
        'result': parse
    }
})

module.exports = router;
