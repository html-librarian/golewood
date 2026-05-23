import http from 'node:http'
import nodemailer from 'nodemailer'

const port = Number(process.env.PORT || 8787)

const smtpUser = process.env.SMTP_USER?.trim()
const smtpPass = process.env.SMTP_PASS?.trim()

if (!smtpUser || !smtpPass) {
  console.error('[mail-relay] Set SMTP_USER and SMTP_PASS')
  process.exit(1)
}

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST?.trim() || 'smtp.mail.ru',
  port: Number(process.env.SMTP_PORT || 465),
  secure: process.env.SMTP_SECURE !== 'false',
  auth: {
    user: smtpUser,
    pass: smtpPass,
  },
})

const fromAddress = process.env.SMTP_FROM?.trim() || smtpUser

const readJsonBody = (req) => new Promise((resolve, reject) => {
  const chunks = []

  req.on('data', (chunk) => {
    chunks.push(chunk)
  })

  req.on('end', () => {
    try {
      resolve(JSON.parse(Buffer.concat(chunks).toString('utf8')))
    } catch (error) {
      reject(error)
    }
  })

  req.on('error', reject)
})

const sendJson = (res, statusCode, payload) => {
  res.writeHead(statusCode, { 'Content-Type': 'application/json' })
  res.end(JSON.stringify(payload))
}

http.createServer(async (req, res) => {
  if (req.method === 'GET' && req.url === '/health') {
    sendJson(res, 200, { ok: true })
    return
  }

  if (req.method !== 'POST' || req.url !== '/send') {
    sendJson(res, 404, { error: 'not_found' })
    return
  }

  try {
    const body = await readJsonBody(req)
    const to = typeof body.to === 'string' ? body.to.trim() : ''
    const subject = typeof body.subject === 'string' ? body.subject.trim() : ''
    const text = typeof body.text === 'string' ? body.text : ''

    if (!to || !subject || !text) {
      sendJson(res, 400, { error: 'missing_fields' })
      return
    }

    await transporter.sendMail({
      from: fromAddress,
      to,
      subject,
      text,
    })

    sendJson(res, 200, { ok: true })
  } catch (error) {
    console.error('[mail-relay] send failed:', error)
    sendJson(res, 502, { error: 'send_failed' })
  }
}).listen(port, '0.0.0.0', () => {
  console.log(`[mail-relay] listening on :${port} (from ${fromAddress})`)
})
