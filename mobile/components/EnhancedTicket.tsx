import React from 'react';
import { View, Text, StyleSheet, Image, ScrollView, Share, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import LinearGradient from 'react-native-linear-gradient';

interface TicketProps {
  ticket: {
    id: string;
    ticket_number: string;
    booking_reference: string;
    passenger_name: string;
    passenger_phone: string;
    trip: {
      origin: string;
      destination: string;
      departure_time: string;
      arrival_time: string;
      bus_info: string;
    };
    seat_numbers: string[];
    total_amount: number;
    company: {
      name: string;
      logo_url?: string;
      phone: string;
      primary_color: string;
      secondary_color: string;
    };
    qr_code: string;
    status: string;
  };
  onShare?: () => void;
  onDownload?: () => void;
}

const EnhancedTicket: React.FC<TicketProps> = ({ ticket, onShare, onDownload }) => {
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-GB', { 
        day: '2-digit', 
        month: 'short', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-GB', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  const departureInfo = formatDate(ticket.trip.departure_time);
  const arrivalInfo = formatDate(ticket.trip.arrival_time);

  const handleShare = async () => {
    try {
      await Share.share({
        message: `GoBus Ticket\n\nBooking: ${ticket.booking_reference}\nFrom: ${ticket.trip.origin}\nTo: ${ticket.trip.destination}\nDate: ${departureInfo.date}\nTime: ${departureInfo.time}\nSeat(s): ${ticket.seat_numbers.join(', ')}\n\nHave a safe journey!`,
        title: 'GoBus Ticket'
      });
    } catch (error) {
      console.error('Error sharing ticket:', error);
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.ticket}>
        {/* Header with Company Branding */}
        <LinearGradient
          colors={[ticket.company.primary_color || '#1E40AF', ticket.company.secondary_color || '#3B82F6']}
          style={styles.header}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
        >
          <View style={styles.headerContent}>
            <View style={styles.companyInfo}>
              {ticket.company.logo_url && (
                <Image 
                  source={{ uri: ticket.company.logo_url }} 
                  style={styles.companyLogo}
                  resizeMode="contain"
                />
              )}
              <View>
                <Text style={styles.companyName}>{ticket.company.name}</Text>
                <Text style={styles.companyPhone}>{ticket.company.phone}</Text>
              </View>
            </View>
            <View style={styles.ticketInfo}>
              <Text style={styles.ticketNumber}>#{ticket.ticket_number}</Text>
              <Text style={styles.bookingRef}>{ticket.booking_reference}</Text>
            </View>
          </View>
        </LinearGradient>

        {/* Route Information */}
        <View style={styles.routeSection}>
          <View style={styles.routeHeader}>
            <Text style={styles.routeTitle}>Journey Details</Text>
            <View style={[styles.statusBadge, { backgroundColor: ticket.status === 'active' ? '#10B981' : '#F59E0B' }]}>
              <Text style={styles.statusText}>{ticket.status.toUpperCase()}</Text>
            </View>
          </View>
          
          <View style={styles.routeInfo}>
            <View style={styles.location}>
              <Text style={styles.locationLabel}>FROM</Text>
              <Text style={styles.locationText}>{ticket.trip.origin}</Text>
              <Text style={styles.dateTime}>{departureInfo.date}</Text>
              <Text style={styles.time}>{departureInfo.time}</Text>
            </View>
            
            <View style={styles.routeLine}>
              <View style={styles.dot} />
              <View style={styles.line} />
              <View style={styles.dot} />
            </View>
            
            <View style={styles.location}>
              <Text style={styles.locationLabel}>TO</Text>
              <Text style={styles.locationText}>{ticket.trip.destination}</Text>
              <Text style={styles.dateTime}>{arrivalInfo.date}</Text>
              <Text style={styles.time}>{arrivalInfo.time}</Text>
            </View>
          </View>
        </View>

        {/* Passenger & Trip Details */}
        <View style={styles.detailsSection}>
          <View style={styles.detailsGrid}>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Passenger</Text>
              <Text style={styles.detailValue}>{ticket.passenger_name}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Phone</Text>
              <Text style={styles.detailValue}>{ticket.passenger_phone}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Seat(s)</Text>
              <Text style={styles.detailValue}>{ticket.seat_numbers.join(', ')}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Bus</Text>
              <Text style={styles.detailValue}>{ticket.trip.bus_info}</Text>
            </View>
            <View style={styles.detailItem}>
              <Text style={styles.detailLabel}>Amount</Text>
              <Text style={styles.detailValue}>{ticket.total_amount.toLocaleString()} RWF</Text>
            </View>
          </View>
        </View>

        {/* QR Code Section */}
        <View style={styles.qrSection}>
          <View style={styles.qrContainer}>
            <Image 
              source={{ uri: ticket.qr_code }}
              style={styles.qrCodeImage}
              resizeMode="contain"
            />
          </View>
          <Text style={styles.qrLabel}>Present this QR code for verification</Text>
          <Text style={styles.qrSubLabel}>Keep this ticket until journey completion</Text>
        </View>
        
        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <TouchableOpacity 
            style={[styles.actionButton, styles.shareButton]} 
            onPress={onShare || handleShare}
          >
            <Text style={styles.shareButtonText}>Share Ticket</Text>
          </TouchableOpacity>
          
          {onDownload && (
            <TouchableOpacity 
              style={[styles.actionButton, styles.downloadButton]} 
              onPress={onDownload}
            >
              <Text style={styles.downloadButtonText}>Download</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>Thank you for choosing {ticket.company.name}</Text>
          <Text style={styles.footerSubText}>Have a safe and comfortable journey!</Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  ticket: {
    backgroundColor: 'white',
    borderRadius: 16,
    margin: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 8,
    overflow: 'hidden',
  },
  header: {
    padding: 20,
  },
  headerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  companyInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  companyLogo: {
    width: 40,
    height: 40,
    marginRight: 12,
    borderRadius: 20,
  },
  companyName: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'white',
  },
  companyPhone: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  ticketInfo: {
    alignItems: 'flex-end',
  },
  ticketNumber: {
    fontSize: 16,
    fontWeight: 'bold',
    color: 'white',
    fontFamily: 'monospace',
  },
  bookingRef: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.8)',
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'white',
  },
  routeSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  routeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  routeTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  routeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    flex: 1,
    alignItems: 'center',
  },
  locationLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '500',
    marginBottom: 4,
  },
  locationText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1F2937',
    textAlign: 'center',
    marginBottom: 4,
  },
  dateTime: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  time: {
    fontSize: 14,
    fontWeight: '600',
    color: '#3B82F6',
  },
  routeLine: {
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#3B82F6',
  },
  line: {
    width: 2,
    height: 40,
    backgroundColor: '#E5E7EB',
    marginVertical: 4,
  },
  detailsSection: {
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  detailsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  detailItem: {
    width: '50%',
    marginBottom: 12,
  },
  detailLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  qrSection: {
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  qrContainer: {
    padding: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    marginBottom: 12,
  },
  qrCodeImage: {
    width: 120,
    height: 120,
  },
  qrLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  qrSubLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    padding: 20,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  shareButton: {
    backgroundColor: '#3B82F6',
  },
  shareButtonText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  downloadButton: {
    backgroundColor: '#F3F4F6',
    borderWidth: 1,
    borderColor: '#D1D5DB',
  },
  downloadButtonText: {
    color: '#374151',
    fontWeight: '600',
    fontSize: 14,
  },
  footer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  footerText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#374151',
    marginBottom: 4,
  },
  footerSubText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
});

export default EnhancedTicket;