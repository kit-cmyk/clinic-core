/**
 * Zod request body validation middleware factory.
 *
 * Usage:
 *   import { validate } from '../middleware/validate.js';
 *   import { z } from 'zod';
 *
 *   const schema = z.object({ email: z.string().email(), password: z.string().min(8) });
 *   router.post('/login', validate(schema), handler);
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((i) => `${i.path.join('.')}: ${i.message}`)
        .join('; ');
      return res.status(400).json({ error: 'validation_error', message });
    }
    req.body = result.data; // replace with parsed + coerced data
    return next();
  };
}
