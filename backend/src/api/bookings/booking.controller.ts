import { Request, Response } from 'express';

export class BookingController {
  static async createBooking(req: Request, res: Response) {
    try {
      const { tripId, seatNumbers, passengerInfo, paymentMethod, promoCode } = req.body;
      const userId = (req as any).user?.id;

      // Advanced booking validation
      const validationResult = await BookingController.validateBooking({
        tripId,
        seatNumbers,
        passengerInfo,
        userId
      });

      if (!validationResult.valid) {
        return res.status(400).json({
          success: false,
          message: validationResult.message,
          errors: validationResult.errors
        });
      }

      // Calculate pricing with dynamic factors
      const pricingDetails = await BookingController.calculateAdvancedPricing({
        tripId,
        seatNumbers,
        promoCode,
        userId
      });

      // Generate advanced booking
      const booking = {
        id: `GBK${Date.now()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`,
        tripId,
        userId,
        seatNumbers,
        passengerInfo: passengerInfo.map((passenger: any, index: number) => ({
          ...passenger,
          seatNumber: seatNumbers[index],
          ticketNumber: `TKT${Date.now()}${index}`,
          qrCode: BookingController.generateQRCode(`${tripId}-${seatNumbers[index]}-${Date.now()}`),
          specialRequests: passenger.specialRequests || []
        })),
        pricing: pricingDetails,
        status: 'confirmed',
        paymentMethod,
        bookingDate: new Date().toISOString(),
        paymentStatus: 'completed',
        confirmationCode: BookingController.generateConfirmationCode(),
        insurance: {
          included: true,
          coverage: 'Basic travel insurance included',
          premium: 0
        },
        notifications: {
          sms: true,
          email: true,
          whatsapp: true
        },
        carbonOffset: {
          emissions: pricingDetails.carbonFootprint,
          offsetCost: Math.round(pricingDetails.carbonFootprint * 100),
          offsetIncluded: false
        },
        loyaltyPoints: {
          earned: Math.floor(pricingDetails.totalAmount / 100),
          redeemed: pricingDetails.loyaltyDiscount > 0 ? Math.floor(pricingDetails.loyaltyDiscount * 10) : 0
        },
        cancellationPolicy: {
          freeCancellation: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          partialRefund: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
          noRefund: new Date().toISOString()
        },
        additionalServices: {
          mealPreference: passengerInfo[0]?.mealPreference || 'none',
          wheelchairAssistance: passengerInfo.some((p: any) => p.wheelchairRequired),
          priorityBoarding: pricingDetails.vipSeats > 0
        }
      };

      // Send confirmation notifications
      await BookingController.sendBookingConfirmations(booking);

      res.status(201).json({
        success: true,
        data: booking,
        message: 'Booking created successfully',
        nextSteps: [
          'Check-in opens 2 hours before departure',
          'Arrive at station 30 minutes early',
          'Keep your QR code ready for boarding'
        ]
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  private static async validateBooking(data: any) {
    const errors = [];
    
    if (!data.tripId) {
      errors.push('Trip ID is required');
    }
    
    if (!data.seatNumbers || data.seatNumbers.length === 0) {
      errors.push('At least one seat must be selected');
    }
    
    if (!data.passengerInfo || data.passengerInfo.length !== data.seatNumbers.length) {
      errors.push('Passenger information must match number of seats');
    }
    
    const existingBooking = false;
    if (existingBooking) {
      errors.push('You already have a booking for this trip');
    }
    
    return {
      valid: errors.length === 0,
      errors,
      message: errors.length > 0 ? 'Booking validation failed' : 'Validation passed'
    };
  }
  
  private static async calculateAdvancedPricing(data: any) {
    const basePrice = 2500;
    const seatCount = data.seatNumbers.length;
    const subtotal = basePrice * seatCount;
    
    const demandMultiplier = 1.1;
    const timeMultiplier = 1.0;
    const loyaltyDiscount = 0;
    const promoDiscount = data.promoCode ? 250 : 0;
    
    const vipSeats = data.seatNumbers.filter((seat: string) => seat.startsWith('A') || seat.startsWith('B')).length;
    const vipSurcharge = vipSeats * 1000;
    
    const taxes = Math.round(subtotal * 0.18);
    const serviceFee = 500;
    const carbonFootprint = seatCount * 12.1;
    
    const totalAmount = Math.round(
      (subtotal * demandMultiplier * timeMultiplier) + 
      vipSurcharge + 
      taxes + 
      serviceFee - 
      loyaltyDiscount - 
      promoDiscount
    );
    
    return {
      basePrice,
      seatCount,
      subtotal,
      demandMultiplier,
      timeMultiplier,
      vipSeats,
      vipSurcharge,
      taxes,
      serviceFee,
      loyaltyDiscount,
      promoDiscount,
      carbonFootprint,
      totalAmount,
      breakdown: {
        'Base fare': subtotal,
        'VIP surcharge': vipSurcharge,
        'Taxes (18%)': taxes,
        'Service fee': serviceFee,
        'Loyalty discount': -loyaltyDiscount,
        'Promo discount': -promoDiscount
      }
    };
  }
  
  private static generateQRCode(data: string): string {
    return `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==`;
  }
  
  private static generateConfirmationCode(): string {
    return Math.random().toString(36).substr(2, 6).toUpperCase();
  }
  
  private static async sendBookingConfirmations(booking: any) {
    console.log(`Sending confirmations for booking ${booking.id}`);
    
    const smsMessage = `GoBus: Booking confirmed! Code: ${booking.confirmationCode}. Trip: ${booking.tripId}. Seats: ${booking.seatNumbers.join(', ')}. Total: ${booking.pricing.totalAmount} RWF`;
    const emailSubject = `Booking Confirmation - ${booking.confirmationCode}`;
    const whatsappMessage = `Your GoBus booking is confirmed! 🚌\nCode: ${booking.confirmationCode}\nShow this message at boarding.`;
    
    return true;
  }

  static async getUserBookings(req: Request, res: Response) {
    try {
      const userId = (req as any).user?.id;
      const { status, page = 1, limit = 10 } = req.query;

      const bookings = [
        {
          id: 'GBK20240115ABCD',
          tripId: 'VolcanoExpress_8_1705123456789',
          confirmationCode: 'VE8K2M',
          from: 'Kigali',
          to: 'Butare',
          date: new Date().toISOString().split('T')[0],
          departure: '08:00',
          arrival: '11:30',
          company: {
            name: 'Volcano Express',
            logo: '/assets/companies/volcano-express.png',
            rating: 4.8
          },
          seatNumbers: ['A1', 'A2'],
          passengerInfo: [
            {
              name: 'John Doe',
              seatNumber: 'A1',
              ticketNumber: 'TKT17051234567890',
              qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            },
            {
              name: 'Jane Doe',
              seatNumber: 'A2',
              ticketNumber: 'TKT17051234567891',
              qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg=='
            }
          ],
          status: 'confirmed',
          totalAmount: 6200,
          paymentMethod: 'MTN Mobile Money',
          paymentStatus: 'completed',
          bookingDate: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
          cancellationDeadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
          canCancel: true,
          canModify: true,
          loyaltyPoints: {
            earned: 62,
            redeemed: 0
          },
          notifications: {
            reminderSent: false,
            checkInAvailable: false
          },
          additionalServices: {
            insurance: true,
            carbonOffset: false,
            mealPreference: 'vegetarian'
          },
          realTimeInfo: {
            busLocation: 'Kigali Bus Station',
            estimatedDelay: 0,
            weatherConditions: 'Sunny, 24°C'
          }
        }
      ];

      const filteredBookings = status ? 
        bookings.filter(booking => booking.status === status) : 
        bookings;

      const startIndex = (parseInt(page as string) - 1) * parseInt(limit as string);
      const paginatedBookings = filteredBookings.slice(startIndex, startIndex + parseInt(limit as string));

      res.json({
        success: true,
        data: paginatedBookings,
        pagination: {
          page: parseInt(page as string),
          limit: parseInt(limit as string),
          total: filteredBookings.length,
          pages: Math.ceil(filteredBookings.length / parseInt(limit as string))
        },
        summary: {
          totalBookings: bookings.length,
          confirmed: bookings.filter(b => b.status === 'confirmed').length,
          cancelled: bookings.filter(b => b.status === 'cancelled').length,
          completed: bookings.filter(b => b.status === 'completed').length,
          totalSpent: bookings.reduce((sum, b) => sum + b.totalAmount, 0),
          loyaltyPointsEarned: bookings.reduce((sum, b) => sum + b.loyaltyPoints.earned, 0)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async cancelBooking(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const { reason } = req.body;
      const userId = (req as any).user?.id;

      const cancellationResult = await BookingController.processCancellation({
        bookingId,
        userId,
        reason
      });

      res.json({
        success: true,
        data: cancellationResult,
        message: 'Booking cancelled successfully'
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  private static async processCancellation(data: any) {
    const now = new Date();
    const cancellationFee = 500;
    const refundAmount = 5700;
    
    return {
      bookingId: data.bookingId,
      status: 'cancelled',
      cancellationDate: now.toISOString(),
      reason: data.reason,
      refund: {
        amount: refundAmount,
        fee: cancellationFee,
        method: 'Original payment method',
        estimatedProcessingTime: '3-5 business days'
      },
      loyaltyPoints: {
        deducted: 62,
        remaining: 0
      }
    };
  }

  static async getBookingDetails(req: Request, res: Response) {
    try {
      const { bookingId } = req.params;
      const userId = (req as any).user?.id;

      const bookingDetails = {
        id: bookingId,
        confirmationCode: 'VE8K2M',
        status: 'confirmed',
        trip: {
          id: 'VolcanoExpress_8_1705123456789',
          from: 'Kigali',
          to: 'Butare',
          date: new Date().toISOString().split('T')[0],
          departure: '08:00',
          arrival: '11:30',
          company: 'Volcano Express',
          busNumber: 'RAD 123A'
        },
        passengers: [
          {
            name: 'John Doe',
            seatNumber: 'A1',
            ticketNumber: 'TKT17051234567890',
            qrCode: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
            boardingPass: {
              gate: 'A3',
              boardingTime: '07:30',
              seatClass: 'VIP'
            }
          }
        ],
        payment: {
          totalAmount: 6200,
          method: 'MTN Mobile Money',
          status: 'completed',
          transactionId: 'MTN123456789',
          breakdown: {
            'Base fare': 5000,
            'VIP surcharge': 1000,
            'Taxes': 700,
            'Service fee': 500,
            'Discount': -1000
          }
        },
        policies: {
          cancellation: {
            deadline: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString(),
            fee: 500,
            refundPercentage: 90
          },
          modification: {
            allowed: true,
            fee: 1000,
            deadline: new Date(Date.now() + 1 * 60 * 60 * 1000).toISOString()
          }
        },
        services: {
          insurance: {
            included: true,
            coverage: 'Basic travel insurance',
            claimProcess: 'Contact support for claims'
          },
          carbonOffset: {
            emissions: 24.2,
            offsetCost: 2420,
            purchased: false
          },
          additionalServices: [
            'Priority boarding',
            'Complimentary refreshments',
            'Extra legroom'
          ]
        },
        notifications: {
          checkInReminder: {
            sent: false,
            scheduledFor: new Date(Date.now() + 2 * 60 * 60 * 1000).toISOString()
          },
          departureReminder: {
            sent: false,
            scheduledFor: new Date(Date.now() + 30 * 60 * 1000).toISOString()
          }
        },
        support: {
          helpline: '+250788123456',
          email: 'support@gobus.rw',
          whatsapp: '+250788123456',
          emergencyContact: '+250788999888'
        }
      };

      res.json({
        success: true,
        data: bookingDetails
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}