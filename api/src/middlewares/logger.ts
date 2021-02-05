import { NextFunction, Request, Response } from 'express';

// TODO
export function loggerMiddleware(request: Request, response: Response, next: NextFunction): void {
  console.log(`${request.method} ${request.path} ${JSON.stringify(request.query)}`);
  next();
}