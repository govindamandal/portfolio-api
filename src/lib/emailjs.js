function getEmailJsConfig() {
  return {
    serviceId: process.env.EMAILJS_SERVICE_ID || '',
    templateId: process.env.EMAILJS_TEMPLATE_ID || '',
    publicKey: process.env.EMAILJS_PUBLIC_KEY || '',
    privateKey: process.env.EMAILJS_PRIVATE_KEY || ''
  }
}

function hasEmailJsConfig() {
  return Boolean(
    process.env.EMAILJS_SERVICE_ID &&
    process.env.EMAILJS_TEMPLATE_ID &&
    process.env.EMAILJS_PUBLIC_KEY
  )
}

async function sendContactEmail({ toEmail, toName, name, email, message }) {
  if (!hasEmailJsConfig()) {
    return false
  }

  const config = getEmailJsConfig()
  const payload = {
    service_id: config.serviceId,
    template_id: config.templateId,
    user_id: config.publicKey,
    template_params: {
      to_email: toEmail,
      to_name: toName || 'Govinda Mandal',
      from_name: name,
      from_email: email,
      reply_to: email,
      message
    }
  }

  if (config.privateKey) {
    payload.accessToken = config.privateKey
  }

  const response = await fetch('https://api.emailjs.com/api/v1.0/email/send', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  })

  if (!response.ok) {
    const error = new Error(await response.text())
    error.statusCode = 502
    error.publicMessage = 'Message saved, but email notification could not be sent'
    throw error
  }

  return true
}

module.exports = { hasEmailJsConfig, sendContactEmail }
