const Router = require('koa-router');
const router = new Router();
const validator = require('validatorjs');
const app = require('../app/app');
const transporter = require('../app/mail');
const config = require('../config.json');

router.get('/contact', async (ctx, next) => {
    let session = ctx.session;

    let result = {};
    result['data'] = {};
    result['meta'] = {};
    result['meta']['login_status'] = await app.getUserId(session.auth_id);

    if (session.error_mail !== undefined) {
        result['data']['error_mail'] = session.error_mail;
        session.error_mail = undefined;
    }

    if (session.error_subject !== undefined) {
        result['data']['error_subject'] = session.error_subject;
        session.error_subject = undefined;
    }

    if (session.error_detail !== undefined) {
        result['data']['error_detail'] = session.error_detail;
        session.error_detail = undefined;
    }

    if (session.success_message !== undefined) {
        result['data']['success_message'] = session.success_message;
        session.success_message = undefined;
    }

    if (session.error_message !== undefined) {
        result['data']['error_message'] = session.error_message;
        session.error_message = undefined;
    }

    await ctx.render('contact', result);
})

router.post('/contact', async (ctx, next) => {
    let session = ctx.session;

    let mail = ctx.request.body.mail;
    let subject = ctx.request.body.subject;
    let detail = ctx.request.body.detail;

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

    if (mailValidate.fails() || subjectValidate.fails()) {
        if (mailValidate.fails()) session.error_mail = '100文字以下のメールアドレスを入力';
        if (subjectValidate.fails()) session.error_subject = '300文字以内で入力してください';
        if (detailValidation.fails()) session.error_detail = '50文字以内で入力してください';

        ctx.redirect('/contact');
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
        session.success_message = 'お問い合わせを送信しました';
    }).catch(() => {
        session.error_message = 'お問い合わせの送信に失敗しました';
    });

    ctx.redirect('/contact')
})

module.exports = router;
