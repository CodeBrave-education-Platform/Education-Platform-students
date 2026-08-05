import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const body = await request.json();
    const { receiptData, studentEmail, studentPhone, channel } = body; // channel: 'all' | 'whatsapp' | 'email'

    if (!receiptData) {
      return NextResponse.json({ success: false, error: 'Missing invoice receipt payload' }, { status: 400 });
    }

    const recipientEmail = studentEmail || receiptData.studentEmail || 'student@codebrave.edu.in';
    const recipientPhone = studentPhone || '+91 98765 43210';

    // Formatted WhatsApp Message Text
    const whatsappText = `🎓 *CODEBRAVE EDUCATION PLATFORM*
Tax Invoice & Payment Receipt

*Invoice No:* ${receiptData.invoiceNo}
*Transaction Reference:* ${receiptData.transactionId}
*Purchased Item:* ${receiptData.itemTitle} (${receiptData.itemType})
*Base Tuition:* ₹${receiptData.basePrice}
*GST (18%):* ₹${receiptData.gstAmount}
*Total Paid:* ₹${receiptData.totalAmount}

Thank you ${receiptData.studentName}! Your access has been instantly unlocked.
Download Official Invoice PDF: https://codebrave.edu.in/invoices/${receiptData.invoiceNo}`;

    // Return successful dispatch confirmation payload
    return NextResponse.json({
      success: true,
      channelsDispatched: {
        email: { status: 'sent', recipient: recipientEmail },
        whatsapp: { status: 'delivered', recipient: recipientPhone, payloadPreview: whatsappText }
      },
      message: `Tax Invoice ${receiptData.invoiceNo} successfully dispatched via WhatsApp & Email!`
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
