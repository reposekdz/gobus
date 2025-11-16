import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { db } from '../../config/database';

export class AuthController {
  static async login(req: Request, res: Response) {
    try {
      const { email, password } = req.body;

      const [users] = await db.execute(
        'SELECT * FROM users WHERE email = ?',
        [email]
      );

      if (!Array.isArray(users) || users.length === 0) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const user = users[0] as any;
      const isValidPassword = await bcrypt.compare(password, user.password_hash);

      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: 'Invalid credentials'
        });
      }

      const token = jwt.sign(
        { userId: user.id, role: user.role },
        'gobus_secret_key_2024',
        { expiresIn: '24h' }
      );

      res.json({
        success: true,
        data: {
          token,
          user: {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            company_id: user.company_id
          }
        }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Login failed',
        error: error.message
      });
    }
  }

  static async register(req: Request, res: Response) {
    try {
      const { name, email, password, phone_number, role = 'passenger' } = req.body;

      const hashedPassword = await bcrypt.hash(password, 12);

      const [result] = await db.execute(`
        INSERT INTO users (name, email, password_hash, phone_number, role)
        VALUES (?, ?, ?, ?, ?)
      `, [name, email, hashedPassword, phone_number, role]);

      const userId = (result as any).insertId;

      res.status(201).json({
        success: true,
        message: 'User registered successfully',
        data: { id: userId, name, email, role }
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Registration failed',
        error: error.message
      });
    }
  }
}