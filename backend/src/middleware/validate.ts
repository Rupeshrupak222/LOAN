import { NextFunction, Request, Response } from 'express';
import { AnyZodObject, ZodEffects } from 'zod';

type Schema = AnyZodObject | ZodEffects<AnyZodObject>;

/** Validates and replaces req.body/query/params with parsed, typed values. */
export function validate(schema: Schema | { body?: Schema; query?: Schema; params?: Schema }) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      if ('parse' in schema) {
        // Single schema passed, default to validating body
        req.body = schema.parse(req.body);
      } else {
        if (schema.body) req.body = schema.body.parse(req.body);
        if (schema.query) req.query = schema.query.parse(req.query) as Request['query'];
        if (schema.params) req.params = schema.params.parse(req.params) as Request['params'];
      }
      next();
    } catch (err) {
      next(err);
    }
  };
}
