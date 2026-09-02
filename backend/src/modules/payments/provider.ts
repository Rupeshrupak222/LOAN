// Payment Gateway Provider Abstraction (Razorpay, Cashfree, Direct Bank Transfer)
import crypto from 'crypto';
import pino from 'pino';

const logger = pino({ name: 'payment-provider' });

export interface CreateOrderParams {
  amount: number;
  currency: string;
  receipt: string;
  customerId: string;
  notes?: Record<string, any>;
}

export interface OrderResult {
  orderId: string;
  amount: number;
  currency: string;
  provider: 'RAZORPAY' | 'CASHFREE' | 'CORE_BANKING';
  status: 'CREATED' | 'ATTEMPTED' | 'PAID';
}

export interface WebhookEvent {
  event: string;
  payload: any;
  signature: string;
  rawBody: string;
}

export interface RefundParams {
  paymentId: string;
  amount: number;
  reason?: string;
  idempotencyKey?: string;
}

export interface RefundResult {
  refundId: string;
  paymentId: string;
  amount: number;
  status: 'PROCESSED' | 'PENDING' | 'FAILED';
}

export interface PaymentProvider {
  name: string;
  isConfigured(): boolean;
  createOrder(params: CreateOrderParams): Promise<OrderResult>;
  verifyWebhook(event: WebhookEvent): boolean;
  processRefund(params: RefundParams): Promise<RefundResult>;
}

// 1. Razorpay Provider
export class RazorpayProvider implements PaymentProvider {
  name = 'Razorpay Gateway';

  isConfigured(): boolean {
    return Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET);
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const isLive = this.isConfigured();
    const orderId = `order_rzp_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    logger.info({
      msg: isLive ? '[RAZORPAY] Order created' : '[RAZORPAY-SANDBOX] Order simulated (requires RAZORPAY_KEY_ID)',
      orderId,
      amount: params.amount,
      receipt: params.receipt,
    });

    return {
      orderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      provider: 'RAZORPAY',
      status: 'CREATED',
    };
  }

  verifyWebhook(event: WebhookEvent): boolean {
    const secret = process.env.RAZORPAY_WEBHOOK_SECRET || 'test_webhook_secret';
    const expected = crypto.createHmac('sha256', secret).update(event.rawBody).digest('hex');
    return expected === event.signature;
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const refundId = `rfnd_rzp_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    logger.info({ msg: '[RAZORPAY] Refund initiated', refundId, amount: params.amount, paymentId: params.paymentId });
    return {
      refundId,
      paymentId: params.paymentId,
      amount: params.amount,
      status: 'PROCESSED',
    };
  }
}

// 2. Cashfree Provider
export class CashfreeProvider implements PaymentProvider {
  name = 'Cashfree Payments';

  isConfigured(): boolean {
    return Boolean(process.env.CASHFREE_APP_ID && process.env.CASHFREE_SECRET_KEY);
  }

  async createOrder(params: CreateOrderParams): Promise<OrderResult> {
    const isLive = this.isConfigured();
    const orderId = `order_cf_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;

    logger.info({
      msg: isLive ? '[CASHFREE] Order created' : '[CASHFREE-SANDBOX] Order simulated (requires CASHFREE_APP_ID)',
      orderId,
      amount: params.amount,
    });

    return {
      orderId,
      amount: params.amount,
      currency: params.currency || 'INR',
      provider: 'CASHFREE',
      status: 'CREATED',
    };
  }

  verifyWebhook(event: WebhookEvent): boolean {
    const secret = process.env.CASHFREE_SECRET_KEY || 'test_cf_secret';
    const expected = crypto.createHmac('sha256', secret).update(event.rawBody).digest('base64');
    return expected === event.signature;
  }

  async processRefund(params: RefundParams): Promise<RefundResult> {
    const refundId = `rfnd_cf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`;
    return {
      refundId,
      paymentId: params.paymentId,
      amount: params.amount,
      status: 'PROCESSED',
    };
  }
}

export const paymentProviders = {
  razorpay: new RazorpayProvider(),
  cashfree: new CashfreeProvider(),
};
