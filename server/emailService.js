// server/emailService.js
const nodemailer = require('nodemailer');

// Create a transporter object using SMTP transport
const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_HOST,
  port: process.env.EMAIL_PORT,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

/**
 * Sends a quote email to a customer.
 * @param {object} customer - The customer object { name, email }.
 * @param {object} quote - The quote object { id, label, quoteItems, total }.
 */
async function sendQuoteEmail(customer, quote) {
  if (!customer.email) {
    console.log(`Customer ${customer.name} has no email address. Skipping email.`);
    return;
  }

  // Calculate the grand total from the quote items
  const grandTotal = quote.quoteItems.reduce((sum, item) => sum + item.lineTotal, 0);

  // Construct HTML for the email
  const htmlBody = `
    <h1>Your Quote from Our Service</h1>
    <p>Hello ${customer.name},</p>
    <p>Thank you for your interest. Here are the details for your quote "${quote.label}":</p>
    <table border="1" cellpadding="5" cellspacing="0" style="width:100%; border-collapse: collapse;">
      <thead>
        <tr>
          <th>Service</th>
          <th>Quantity</th>
          <th>Unit Price</th>
          <th>Line Total</th>
        </tr>
      </thead>
      <tbody>
        ${quote.quoteItems.map(item => `
          <tr>
            <td>${item.service.name}</td>
            <td>${item.qty}</td>
            <td>$${item.service.cost.toFixed(2)}</td>
            <td>$${item.lineTotal.toFixed(2)}</td>
          </tr>
        `).join('')}
      </tbody>
      <tfoot>
        <tr>
          <td colspan="3" style="text-align:right;"><strong>Grand Total:</strong></td>
          <td><strong>$${grandTotal.toFixed(2)}</strong></td>
        </tr>
      </tfoot>
    </table>
    <p>We look forward to working with you!</p>
  `;

  try {
    const info = await transporter.sendMail({
      from: '"Our Service" <no-reply@example.com>',
      to: customer.email,
      subject: `Your Quote #${quote.id}: ${quote.label}`,
      html: htmlBody,
    });

    console.log('Message sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending quote email:', error);
  }
}

module.exports = { sendQuoteEmail };
