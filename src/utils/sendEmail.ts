import nodemailer from "nodemailer";

const sendEmail = async (to: string, html: string) => {
  let transporter = nodemailer.createTransport({
    host: "smtp.yandex.ru",
    port: 465,
    secure: true,
    auth: {
      user: process.env.YANDEX_USER,
      pass: process.env.YANDEX_PASS,
    },
  });

  let info = await transporter.sendMail({
    from: '"LearnCards - change password" <learn.cards@yandex.ru>',
    to,
    subject: "Change password",
    html,
  });
};

export default sendEmail;
