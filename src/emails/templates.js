const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.brevo.com',
  port: 465,
  secure: true,  // dodaj ovo
  auth: {
    user: process.env.BREVO_SMTP_USER,
    pass: process.env.BREVO_SMTP_PASS
  }
});

const BUSINESS_NAME = 'FSociety Computer Services';
const BUSINESS_PHONE = '(064) 032-8443';
const PRIMARY_COLOR = '#E01B1B';
const GREEN_COLOR = '#00FF41';
const SENDER_EMAIL = 'fsociety.service.nyc@gmail.com';
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;

function baseLayout(content) {
  return `
    <div style="font-family:'Courier New',Courier,monospace;max-width:600px;margin:0 auto;background:#0A0A0A;color:#FFFFFF;">
      <div style="background:#111111;border-bottom:3px solid ${PRIMARY_COLOR};padding:28px 32px;display:flex;align-items:center;gap:12px;">
        <div>
          <div style="font-size:20px;font-weight:700;color:${PRIMARY_COLOR};letter-spacing:2px;">${BUSINESS_NAME}</div>
          <div style="font-size:11px;color:#888888;letter-spacing:1px;text-transform:uppercase;">New York, NY · (064) 032-8443</div>
        </div>
      </div>
      <div style="padding:32px;background:#0A0A0A;">${content}</div>
      <div style="background:#111111;border-top:1px solid #222222;padding:20px 32px;text-align:center;">
        <p style="color:#555555;margin:0;font-size:12px;">
          ${BUSINESS_NAME} · 135 East 57th Street, New York, NY 10022<br>
          <a href="mailto:${SENDER_EMAIL}" style="color:#555555;">${SENDER_EMAIL}</a>
        </p>
      </div>
    </div>
  `;
}

function statusBox(color, label, rows) {
  const rowsHtml = rows.map(([k, v]) =>
    `<tr>
      <td style="color:#888888;padding:6px 0;padding-right:20px;font-size:13px;white-space:nowrap;">${k}</td>
      <td style="color:#FFFFFF;padding:6px 0;font-size:13px;">${v}</td>
    </tr>`
  ).join('');
  return `
    <div style="background:#111111;border:1px solid ${color};border-left:4px solid ${color};border-radius:6px;padding:20px 24px;margin:24px 0;">
      <div style="font-size:11px;color:${color};letter-spacing:1px;text-transform:uppercase;margin-bottom:14px;">${label}</div>
      <table style="border-collapse:collapse;width:100%;">${rowsHtml}</table>
    </div>
  `;
}

async function sendBookingRequestToUser(booking) {
  try {
    await transporter.sendMail({
      from: `${BUSINESS_NAME} <${SENDER_EMAIL}>`,
      to: booking.email,
      subject: `[PENDING] Booking Request Received — ${BUSINESS_NAME}`,
      html: baseLayout(`
        <p style="color:${GREEN_COLOR};font-size:12px;margin-bottom:20px;">&gt; STATUS: PENDING CONFIRMATION</p>
        <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 12px;">Hi ${booking.name},</h2>
        <p style="color:#888888;font-size:14px;line-height:1.7;margin-bottom:0;">We received your booking request and will confirm it shortly. You'll get another email once confirmed.</p>
        ${statusBox('#888888', 'BOOKING_DETAILS', [
          ['Service', booking.serviceType],
          ['Date', booking.date],
          ['Time', booking.time],
          ['Address', booking.address],
          ...(booking.notes ? [['Notes', booking.notes]] : [])
        ])}
        <p style="color:#888888;font-size:13px;">Questions? Call us: <a href="tel:+10640328443" style="color:${PRIMARY_COLOR};">${BUSINESS_PHONE}</a></p>
      `)
    });
  } catch (e) { console.error('Email error (user request):', e.message); }
}

async function sendBookingNotificationToAdmin(booking) {
  try {
    await transporter.sendMail({
      from: `${BUSINESS_NAME} Booking <${SENDER_EMAIL}>`,
      to: ADMIN_EMAIL,
      subject: `[NEW BOOKING] ${booking.name} — ${booking.date} at ${booking.time}`,
      html: baseLayout(`
        <p style="color:${GREEN_COLOR};font-size:12px;margin-bottom:20px;">&gt; NEW_BOOKING_REQUEST</p>
        <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 20px;">New Booking Request</h2>
        ${statusBox(GREEN_COLOR, 'CLIENT_INFO', [
          ['Name', booking.name],
          ['Email', `<a href="mailto:${booking.email}" style="color:${PRIMARY_COLOR};">${booking.email}</a>`],
          ['Phone', `<a href="tel:${booking.phone}" style="color:${PRIMARY_COLOR};">${booking.phone}</a>`],
          ['Address', booking.address]
        ])}
        ${statusBox('#E01B1B', 'APPOINTMENT_DETAILS', [
          ['Service', booking.serviceType],
          ['Date', booking.date],
          ['Time', booking.time],
          ...(booking.notes ? [['Notes', booking.notes]] : [])
        ])}
        <p style="color:#888888;font-size:13px;">Log into the <strong style="color:#FFFFFF;">admin dashboard</strong> to confirm or cancel this booking.</p>
      `)
    });
  } catch (e) { console.error('Email error (admin notify):', e.message); }
}

async function sendConfirmationToUser(booking) {
  try {
    await transporter.sendMail({
      from: `${BUSINESS_NAME} <${SENDER_EMAIL}>`,
      to: booking.email,
      subject: `[CONFIRMED] Appointment Confirmed — ${BUSINESS_NAME}`,
      html: baseLayout(`
        <p style="color:${GREEN_COLOR};font-size:12px;margin-bottom:20px;">&gt; STATUS: CONFIRMED</p>
        <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 12px;">Appointment Confirmed</h2>
        <p style="color:#888888;font-size:14px;line-height:1.7;margin-bottom:0;">Hi ${booking.name}, your appointment has been confirmed. We look forward to seeing you!</p>
        ${statusBox(GREEN_COLOR, 'CONFIRMED_APPOINTMENT', [
          ['Service', booking.serviceType],
          ['Date', booking.date],
          ['Time', booking.time],
          ['Address', booking.address]
        ])}
        <p style="color:#888888;font-size:13px;">Need to reschedule? Call us: <a href="tel:+10640328443" style="color:${PRIMARY_COLOR};">${BUSINESS_PHONE}</a></p>
      `)
    });
  } catch (e) { console.error('Email error (confirm):', e.message); }
}

async function sendCancellationToUser(booking) {
  try {
    await transporter.sendMail({
      from: `${BUSINESS_NAME} <${SENDER_EMAIL}>`,
      to: booking.email,
      subject: `[CANCELLED] Appointment Cancelled — ${BUSINESS_NAME}`,
      html: baseLayout(`
        <p style="color:${PRIMARY_COLOR};font-size:12px;margin-bottom:20px;">&gt; STATUS: CANCELLED</p>
        <h2 style="color:#FFFFFF;font-size:20px;margin:0 0 12px;">Appointment Cancelled</h2>
        <p style="color:#888888;font-size:14px;line-height:1.7;margin-bottom:0;">Hi ${booking.name}, your booking for <strong style="color:#FFFFFF;">${booking.date} at ${booking.time}</strong> has been cancelled.</p>
        <p style="color:#888888;font-size:14px;margin-top:16px;">To rebook or ask questions, please call us: <a href="tel:+10640328443" style="color:${PRIMARY_COLOR};">${BUSINESS_PHONE}</a></p>
      `)
    });
  } catch (e) { console.error('Email error (cancel):', e.message); }
}

module.exports = {
  sendBookingRequestToUser,
  sendBookingNotificationToAdmin,
  sendConfirmationToUser,
  sendCancellationToUser
};
