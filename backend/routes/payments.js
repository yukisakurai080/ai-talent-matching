require('dotenv').config();
const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Stripe Checkoutセッション作成
router.post('/create-checkout-session', async (req, res) => {
  try {
    const {
      applicantId,
      applicantName,
      placementFee,
      visaSupportFee,
      registeredSupportOrgFee,
      totalAmount,
      visaSupportOption,
      registeredSupportOption,
      companyEmail,
      companyName
    } = req.body;

    // 税込金額を計算
    const totalAmountWithTax = Math.floor(totalAmount * 1.1);

    // 商品ラインアイテムを作成
    const lineItems = [
      {
        price_data: {
          currency: 'jpy',
          product_data: {
            name: `成約料 - ${applicantName}様の採用`,
            description: `応募者: ${applicantName} (${applicantId})`,
          },
          unit_amount: Math.floor(placementFee * 1.1), // 税込
        },
        quantity: 1,
      }
    ];

    // 在留資格サポート費用を追加
    if (visaSupportFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: '在留資格手続きフルサポート',
            description: '行政書士による在留資格取得・変更手続きのサポート',
          },
          unit_amount: Math.floor(visaSupportFee * 1.1), // 税込
        },
        quantity: 1,
      });
    }

    // 登録支援機関委託費用を追加
    if (registeredSupportOrgFee > 0) {
      lineItems.push({
        price_data: {
          currency: 'jpy',
          product_data: {
            name: '登録支援機関委託費用（特定技能1号）',
            description: '年間サポート費用',
          },
          unit_amount: Math.floor(registeredSupportOrgFee * 1.1), // 税込
        },
        quantity: 1,
      });
    }

    // Stripe Checkoutセッションを作成
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.FRONTEND_URL}/payment-success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.FRONTEND_URL}/payment-cancel`,
      customer_email: companyEmail,
      metadata: {
        applicantId,
        applicantName,
        placementFee: placementFee.toString(),
        visaSupportFee: visaSupportFee.toString(),
        registeredSupportOrgFee: registeredSupportOrgFee.toString(),
        totalAmount: totalAmount.toString(),
        visaSupportOption: visaSupportOption || 'none',
        registeredSupportOption: registeredSupportOption || 'none',
        companyName: companyName || companyEmail
      }
    });

    res.json({ url: session.url, sessionId: session.id });
  } catch (error) {
    console.error('Error creating checkout session:', error);
    res.status(500).json({ error: 'Checkoutセッションの作成に失敗しました', details: error.message });
  }
});

// Stripe Webhook（決済完了通知）
router.post('/webhook', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // イベントタイプに応じて処理
  switch (event.type) {
    case 'checkout.session.completed':
      const session = event.data.object;
      console.log('Payment successful:', session);

      // ここでデータベースに決済情報を保存
      // 例: Payment.create({ ... })
      // 例: 採用ステータスを更新
      // 例: メール通知を送信

      break;

    case 'payment_intent.payment_failed':
      const paymentIntent = event.data.object;
      console.log('Payment failed:', paymentIntent);
      // 決済失敗の処理
      break;

    default:
      console.log(`Unhandled event type ${event.type}`);
  }

  res.json({ received: true });
});

// セッション情報取得（決済完了ページ用）
router.get('/session/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await stripe.checkout.sessions.retrieve(sessionId);
    res.json(session);
  } catch (error) {
    console.error('Error retrieving session:', error);
    res.status(500).json({ error: 'セッション情報の取得に失敗しました' });
  }
});

module.exports = router;
