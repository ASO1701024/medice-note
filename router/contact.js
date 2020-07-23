const Router = require('koa-router');
const router = new Router();
const validator = require('validatorjs');
const app = require('../app/app');
const transporter = require('../app/mail');
const config = require('../config.json');

router.get('/contact', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let result = app.initializeRenderResult();
    let authId = session.auth_id;
    let userId = await app.getUserId(authId);

    result['data']['meta']['login_status'] = Boolean(userId);
    result['data']['meta']['site_title'] = 'お問い合わせ - Medice Note';
    result['data']['meta']['seo']['bool'] = true;
    result['data']['meta']['seo']['description'] = 'Medice Noteのサポート';
    result['data']['meta']['seo']['url'] = 'https://www.medice-note.vxx0.com/contact';

    if (Boolean(userId)) {
        result['data']['meta']['group_list'] = await app.getGroupList(userId);
    }

    if (session.success !== undefined) {
        result['data']['success'] = session.success;
        session.success = undefined;
    }

    if (session.error !== undefined) {
        result['data']['error'] = session.error;
        session.error = undefined;
    }

    if (session.old !== undefined) {
        result['data']['old'] = session.old;
        session.old = undefined;
    }

    await ctx.render('contact', result);
})

router.post('/contact', async (ctx) => {
    let session = ctx.session;
    app.initializeSession(session);

    let mail = ctx.request.body['mail'];
    let subject = ctx.request.body['subject'];
    let detail = ctx.request.body['detail'];

    let mailValidate = new validator({
        mail: mail
    }, {
        mail: 'required|email|max:100'
    });
    let subjectValidate = new validator({
        subject: subject
    }, {
        subject: 'required|string|min:1|max:50'
    });
    let detailValidation = new validator({
        detail: detail
    }, {
        detail: 'required|string|min:1|max:300'
    })

    if (mailValidate.fails() || subjectValidate.fails() || detailValidation.fails()) {
        session.old.mail = mail;
        session.old.subject = subject;
        session.old.detail = detail;

        if (mailValidate.fails()) session.error.mail = '100文字以下のメールアドレスを入力';
        if (subjectValidate.fails()) session.error.subject = '50文字以内で入力してください';
        if (detailValidation.fails()) session.error.detail = '300文字以内で入力してください';

        return ctx.redirect('/contact');
    }

    await transporter.sendMail({
        from: config.mail.auth.user,
        to: mail,
        bcc: config.mail.auth.user,
        subject: 'お問い合わせ',
        text: 'お問い合わせいただきありがとうございます\n' +
            '担当者が確認でき次第ご連絡いたします\n' +
            '---------------------------------\n' +
            '件名：' + subject + '\n' +
            '内容：\n' +
            subject
    }).then(() => {
        session.success.message = 'お問い合わせを送信しました';
    }).catch(() => {
        session.error.message = 'お問い合わせの送信に失敗しました';
    });

    ctx.redirect('/contact')
})

module.exports = router;
