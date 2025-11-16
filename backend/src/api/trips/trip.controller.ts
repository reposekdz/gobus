import { Request, Response } from 'express';

export class TripController {
  static async searchTrips(req: Request, res: Response) {
    try {
      const { from, to, date, passengers, class: travelClass } = req.query;
      
      // Advanced trip search with real-time data
      const searchResults = await TripController.performAdvancedSearch({
        from: from as string,
        to: to as string,
        date: date as string,
        passengers: passengers ? parseInt(passengers as string) : 1,
        class: travelClass as string
      });

      // Apply dynamic pricing based on demand
      const tripsWithDynamicPricing = searchResults.map(trip => ({
        ...trip,
        originalPrice: trip.price,
        price: TripController.calculateDynamicPrice(trip),
        priceChange: TripController.getPriceChangeIndicator(trip),
        carbonFootprint: TripController.calculateCarbonFootprint(trip),
        weatherInfo: TripController.getWeatherInfo(trip.from, trip.to),
        realTimeUpdates: TripController.getRealTimeUpdates(trip.id)
      }));

      res.json({
        success: true,
        data: tripsWithDynamicPricing,
        searchMetadata: {
          totalResults: tripsWithDynamicPricing.length,
          searchTime: Date.now(),
          filters: { from, to, date, passengers, class: travelClass },
          recommendations: TripController.getRecommendations(from as string, to as string)
        }
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  private static async performAdvancedSearch(params: any) {
    // Simulate advanced search with multiple bus companies
    const companies = [
      { name: 'Volcano Express', rating: 4.8, amenities: ['WiFi', 'AC', 'USB', 'Entertainment'] },
      { name: 'Rwanda Express', rating: 4.6, amenities: ['WiFi', 'AC', 'Refreshments'] },
      { name: 'Kigali Bus Services', rating: 4.7, amenities: ['WiFi', 'AC', 'USB', 'Reclining Seats'] },
      { name: 'Nyabugogo Express', rating: 4.5, amenities: ['AC', 'USB'] },
      { name: 'Highland Express', rating: 4.9, amenities: ['WiFi', 'AC', 'USB', 'Entertainment', 'Meals'] }
    ];

    const trips = [];
    const basePrice = TripController.getBasePrice(params.from, params.to);
    
    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      const departureHours = [6, 8, 10, 12, 14, 16, 18, 20];
      
      for (let j = 0; j < Math.min(3, departureHours.length); j++) {
        const departure = departureHours[j + i];
        if (!departure) continue;
        
        const trip = {
          id: `${company.name.replace(/\s+/g, '')}_${departure}_${Date.now()}`,
          from: params.from,
          to: params.to,
          date: params.date,
          departure: `${departure.toString().padStart(2, '0')}:00`,
          arrival: `${(departure + 3).toString().padStart(2, '0')}:30`,
          duration: '3h 30m',
          price: basePrice + (company.rating * 500) + (Math.random() * 1000),
          company: company.name,
          companyRating: company.rating,
          availableSeats: Math.floor(Math.random() * 30) + 10,
          totalSeats: 50,
          busType: params.class === 'vip' ? 'VIP' : 'Standard',
          amenities: company.amenities,
          route: TripController.getRoute(params.from, params.to),
          cancellationPolicy: 'Free cancellation up to 2 hours before departure',
          loyaltyPoints: Math.floor(basePrice / 100)
        };
        trips.push(trip);
      }
    }
    
    return trips.sort((a, b) => a.departure.localeCompare(b.departure));
  }

  private static getBasePrice(from: string, to: string): number {
    const routes = {
      'Kigali-Butare': 2500,
      'Kigali-Musanze': 3000,
      'Kigali-Rubavu': 3500,
      'Kigali-Huye': 2500,
      'Butare-Musanze': 4000,
      'Musanze-Rubavu': 2000
    };
    return routes[`${from}-${to}`] || routes[`${to}-${from}`] || 2000;
  }

  private static calculateDynamicPrice(trip: any): number {
    const demandMultiplier = trip.availableSeats < 10 ? 1.2 : trip.availableSeats < 20 ? 1.1 : 1.0;
    const timeMultiplier = ['08:00', '18:00'].includes(trip.departure) ? 1.15 : 1.0;
    return Math.round(trip.price * demandMultiplier * timeMultiplier);
  }

  private static getPriceChangeIndicator(trip: any): string {
    const change = Math.random();
    if (change < 0.3) return 'decreased';
    if (change > 0.7) return 'increased';
    return 'stable';
  }

  private static calculateCarbonFootprint(trip: any): number {
    // CO2 emissions per passenger in kg
    const distance = TripController.getDistance(trip.from, trip.to);
    return Math.round(distance * 0.089 * 100) / 100; // 89g CO2 per km per passenger
  }

  private static getDistance(from: string, to: string): number {
    const distances = {
      'Kigali-Butare': 135,
      'Kigali-Musanze': 116,
      'Kigali-Rubavu': 160,
      'Kigali-Huye': 135
    };
    return distances[`${from}-${to}`] || distances[`${to}-${from}`] || 100;
  }

  private static getWeatherInfo(from: string, to: string) {
    const conditions = ['Sunny', 'Partly Cloudy', 'Cloudy', 'Light Rain'];
    return {
      departure: {
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        temperature: Math.floor(Math.random() * 10) + 20
      },
      arrival: {
        condition: conditions[Math.floor(Math.random() * conditions.length)],
        temperature: Math.floor(Math.random() * 10) + 18
      }
    };
  }

  private static getRealTimeUpdates(tripId: string) {
    const updates = [
      'On time',
      'Delayed by 15 minutes',
      'Boarding now',
      'Departed on time'
    ];
    return updates[Math.floor(Math.random() * updates.length)];
  }

  private static getRoute(from: string, to: string): string[] {
    const routes = {
      'Kigali-Butare': ['Kigali', 'Muhanga', 'Huye', 'Butare'],
      'Kigali-Musanze': ['Kigali', 'Rulindo', 'Musanze'],
      'Kigali-Rubavu': ['Kigali', 'Muhanga', 'Karongi', 'Rubavu']
    };
    return routes[`${from}-${to}`] || routes[`${to}-${from}`] || [from, to];
  }

  private static getRecommendations(from: string, to: string) {
    return {
      bestTime: 'Early morning departures are usually less crowded',
      alternativeRoutes: ['Consider VIP class for longer journeys', 'Book in advance for better prices'],
      nearbyDestinations: ['Musanze', 'Huye', 'Rubavu']
    };
  }

  static async getTripDetails(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      
      // Advanced trip details with real-time information
      const tripDetails = {
        id: tripId,
        from: 'Kigali',
        to: 'Butare',
        date: new Date().toISOString().split('T')[0],
        departure: '08:00',
        arrival: '10:30',
        duration: '3h 30m',
        price: 2500,
        dynamicPrice: 2750,
        company: {
          name: 'Volcano Express',
          rating: 4.8,
          totalTrips: 15420,
          onTimePerformance: 94.2,
          logo: '/assets/companies/volcano-express.png',
          contact: '+250788123456',
          email: 'info@volcanoexpress.rw'
        },
        bus: {
          plateNumber: 'RAD 123A',
          model: 'Yutong ZK6122H9',
          year: 2022,
          features: ['GPS Tracking', 'CCTV', 'Emergency Exits', 'First Aid Kit'],
          lastMaintenance: '2024-01-15',
          driverInfo: {
            name: 'Jean Baptiste',
            experience: '8 years',
            rating: 4.9,
            license: 'A1234567'
          }
        },
        seating: {
          availableSeats: 25,
          totalSeats: 50,
          seatMap: TripController.generateSeatMap(50, 25),
          classes: {
            standard: { available: 20, price: 2500 },
            vip: { available: 5, price: 3500 }
          }
        },
        amenities: [
          { name: 'WiFi', available: true, description: 'Free high-speed internet' },
          { name: 'AC', available: true, description: 'Climate controlled' },
          { name: 'USB Charging', available: true, description: 'USB ports at every seat' },
          { name: 'Entertainment', available: true, description: 'Movies and music' },
          { name: 'Refreshments', available: true, description: 'Complimentary snacks' }
        ],
        route: {
          stops: [
            { name: 'Kigali', time: '08:00', duration: '0m' },
            { name: 'Muhanga', time: '09:15', duration: '10m' },
            { name: 'Huye', time: '10:45', duration: '5m' },
            { name: 'Butare', time: '11:30', duration: '0m' }
          ],
          totalDistance: 135,
          estimatedFuelCost: 15000
        },
        policies: {
          cancellation: {
            free: '2+ hours before departure',
            partial: '30 minutes - 2 hours before (50% refund)',
            none: 'Less than 30 minutes before departure'
          },
          baggage: {
            included: '20kg checked + 7kg carry-on',
            excess: '500 RWF per additional kg'
          },
          children: {
            infant: 'Free (0-2 years, no seat)',
            child: '50% discount (2-12 years)'
          }
        },
        realTimeInfo: {
          currentLocation: 'Kigali Bus Station',
          status: 'On Schedule',
          weatherConditions: 'Sunny, 24°C',
          trafficConditions: 'Light traffic expected',
          estimatedDelay: 0,
          lastUpdated: new Date().toISOString()
        },
        reviews: {
          averageRating: 4.6,
          totalReviews: 1247,
          breakdown: {
            5: 65,
            4: 25,
            3: 8,
            2: 1,
            1: 1
          },
          recent: [
            {
              rating: 5,
              comment: 'Excellent service, very comfortable journey',
              author: 'Marie K.',
              date: '2024-01-10'
            },
            {
              rating: 4,
              comment: 'Good value for money, arrived on time',
              author: 'Paul M.',
              date: '2024-01-08'
            }
          ]
        },
        carbonFootprint: {
          perPassenger: 12.1,
          comparison: 'vs Car: 75% less CO2',
          offsetOptions: [
            { name: 'Plant a tree', cost: 2000, description: 'Offset 15kg CO2' },
            { name: 'Renewable energy', cost: 1500, description: 'Support clean energy' }
          ]
        },
        loyaltyProgram: {
          pointsEarned: 25,
          currentTier: 'Silver',
          nextTierRequirement: '5 more trips',
          benefits: ['Priority boarding', '10% discount on next trip']
        }
      };

      res.json({
        success: true,
        data: tripDetails
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  private static generateSeatMap(totalSeats: number, availableSeats: number) {
    const seatMap = [];
    const rows = Math.ceil(totalSeats / 4);
    
    for (let row = 1; row <= rows; row++) {
      const rowSeats = [];
      for (let seat = 1; seat <= 4; seat++) {
        const seatNumber = `${String.fromCharCode(64 + seat)}${row}`;
        const isAvailable = Math.random() < (availableSeats / totalSeats);
        rowSeats.push({
          number: seatNumber,
          available: isAvailable,
          type: seat <= 2 ? 'window' : 'aisle',
          class: row <= 2 ? 'vip' : 'standard'
        });
      }
      seatMap.push(rowSeats);
    }
    
    return seatMap;
  }

  // Advanced trip management endpoints
  static async getLiveTracking(req: Request, res: Response) {
    try {
      const { tripId } = req.params;
      
      const trackingData = {
        tripId,
        currentLocation: {
          latitude: -1.9441,
          longitude: 30.0619,
          address: 'Muhanga District, Rwanda'
        },
        progress: {
          percentage: 45,
          distanceCovered: 61,
          distanceRemaining: 74,
          estimatedArrival: '10:45'
        },
        speed: 65,
        nextStop: {
          name: 'Huye',
          eta: '10:30',
          duration: '5 minutes'
        },
        alerts: [],
        passengerCount: 38
      };
      
      res.json({
        success: true,
        data: trackingData
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }

  static async getTripAnalytics(req: Request, res: Response) {
    try {
      const { route, period } = req.query;
      
      const analytics = {
        route,
        period,
        metrics: {
          totalTrips: 1247,
          averageOccupancy: 78.5,
          onTimePerformance: 94.2,
          customerSatisfaction: 4.6,
          revenue: 3118750,
          carbonSaved: 15420
        },
        trends: {
          bookings: [120, 135, 142, 138, 155, 148, 162],
          revenue: [300000, 337500, 355000, 345000, 387500, 370000, 405000],
          satisfaction: [4.5, 4.6, 4.7, 4.6, 4.8, 4.7, 4.6]
        },
        insights: [
          'Peak booking times: 6-8 AM and 5-7 PM',
          'Friday and Sunday show highest demand',
          'VIP class bookings increased by 23% this month'
        ]
      };
      
      res.json({
        success: true,
        data: analytics
      });
    } catch (error: any) {
      res.status(500).json({
        success: false,
        message: error.message
      });
    }
  }
}