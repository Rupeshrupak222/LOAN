import { describe, it, expect, vi } from 'vitest';
import { Request, Response } from 'express';
import { requestTimeout } from './timeout';

describe('requestTimeout Middleware', () => {
  it('passes normal fast requests through and cleans up timer', () => {
    const middleware = requestTimeout({ defaultTimeoutMs: 100 });
    const req = { originalUrl: '/api/v1/customers', headers: {} } as Request;
    let finishHandler: () => void = () => {};
    const res = {
      headersSent: false,
      once: vi.fn((event, handler) => {
        if (event === 'finish') finishHandler = handler;
      }),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    // Simulate response finishing
    finishHandler();
    expect(res.status).not.toHaveBeenCalled();
  });

  it('triggers 504 Gateway Timeout when request exceeds timeout duration', async () => {
    const middleware = requestTimeout({ defaultTimeoutMs: 50 });
    const req = { originalUrl: '/api/v1/customers', headers: {} } as Request;
    const res = {
      headersSent: false,
      once: vi.fn(),
      status: vi.fn().mockReturnThis(),
      json: vi.fn(),
    } as unknown as Response;
    const next = vi.fn();

    middleware(req, res, next);
    expect(next).toHaveBeenCalledTimes(1);

    await new Promise((r) => setTimeout(r, 80));

    expect(res.status).toHaveBeenCalledWith(504);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        success: false,
        error: expect.objectContaining({ code: 'GATEWAY_TIMEOUT' }),
      })
    );
  });
});
