declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        name: string;
        email: string;
        role: string;
        company_id?: number;
      };
    }
  }
}

export {};