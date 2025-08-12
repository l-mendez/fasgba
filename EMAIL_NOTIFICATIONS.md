# Email Notification System

This document describes the email notification system implemented for the FASGBA chess federation website.

## Overview

The email notification system automatically sends email notifications when new news articles are posted to the website. It uses Node Mailer with Zoho SMTP for reliable email delivery.

## Features

- 🔔 Automatic email notifications when news is published
- 📧 Beautiful HTML email templates with branding
- 🏢 Support for both FASGBA and club-specific news
- 🧪 Test endpoint for verification
- 🔒 Secure authentication with JWT tokens
- 📱 Responsive email design

## Architecture

### API Endpoints

1. **`/api/notifications/email`** - Main email notification endpoint
2. **`/api/notifications/email/test`** - Test endpoint for verification

### Email Configuration

The system uses Zoho SMTP with the following configuration:

```javascript
const transporter = nodemailer.createTransport({
  host: "smtp.zoho.com",
  port: 465, // use 465 for secure SSL
  secure: true, // true for port 465
  auth: {
    user: "notificaciones@my-website.com", // your Zoho email
    pass: "NO_REPLY_PASSWORD", // password or app-specific password if using 2FA
  },
})
```

### Integration Points

The email notification is integrated into the news creation flow:

- **Main news form**: `app/noticias/nueva/new-news-form.tsx`
- **Club admin flow**: Uses the same form via redirects
- **API endpoints**: `app/api/news/route.ts` and related endpoints

## Setup Instructions

### 1. Email Account Configuration

1. Set up a Zoho email account for `notificaciones@my-website.com`
2. If using 2FA, create an app-specific password
3. Update the credentials in the email configuration

### 2. Environment Variables

Add the following environment variables (if needed for production):

```env
EMAIL_HOST=smtp.zoho.com
EMAIL_PORT=465
EMAIL_USER=notificaciones@my-website.com
EMAIL_PASS=NO_REPLY_PASSWORD
```

### 3. Testing

To test the email system:

```bash
# Make sure the server is running
npm run dev

# Run the email test
npm run test:email
```

Alternatively, you can test manually using curl:

```bash
curl -X POST http://localhost:3000/api/notifications/email/test \
  -H "Content-Type: application/json"
```

## Email Templates

### News Notification Email

When a news article is created, the system sends an email with:

- **Subject**: `Nueva noticia: [News Title]`
- **Content**: News title, source (FASGBA or club), date, and extract
- **Design**: Branded HTML template with FASGBA colors (#8B4513)

### Test Email

The test endpoint sends a verification email to confirm the system is working properly.

## Security Features

- 🔐 JWT token authentication required
- 🛡️ User permission validation
- 🚫 Rate limiting (inherent via API structure)
- ✅ Input validation and sanitization

## Error Handling

The system includes comprehensive error handling:

- **Non-blocking**: Email failures don't block news creation
- **Logging**: All email attempts are logged
- **Graceful degradation**: System continues to function even if emails fail

## Troubleshooting

### Common Issues

1. **Email not sending**
   - Check SMTP credentials
   - Verify internet connection
   - Check Zoho account status

2. **Authentication errors**
   - Verify JWT token is valid
   - Check user permissions
   - Ensure session is active

3. **Template rendering issues**
   - Check news data retrieval
   - Verify database connection
   - Review email template syntax

### Debug Steps

1. Check server logs for email sending attempts
2. Use the test endpoint to verify basic functionality
3. Verify SMTP connection manually
4. Check email delivery in recipient's spam folder

## Future Enhancements

Potential improvements for the email notification system:

- 📧 **Subscription management**: Allow users to subscribe/unsubscribe
- 🎯 **Targeted notifications**: Send only relevant news to interested users
- 📊 **Analytics**: Track email open rates and engagement
- 🔄 **Email queuing**: Implement background job processing for large lists
- 🎨 **Template customization**: Allow clubs to customize email templates
- 📱 **Mobile optimization**: Further optimize for mobile email clients

## API Reference

### Send News Notification

```http
POST /api/notifications/email
Authorization: Bearer <jwt_token>
Content-Type: application/json

{
  "type": "news_created",
  "newsId": 123,
  "recipientEmail": "test@example.com" // Optional, for testing
}
```

### Test Email System

```http
POST /api/notifications/email/test
Content-Type: application/json
```

## Support

For issues with the email notification system, check:

1. Server logs for detailed error messages
2. SMTP provider (Zoho) status
3. Network connectivity
4. Email account configuration

---

**Note**: Currently configured for testing with `lolomendez985@gmail.com`. Update recipient logic for production deployment. 