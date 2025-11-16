import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image } from 'react-native';
import { toDataURL } from 'qrcode';

const Icon = ({ name, style }) => <Text style={[{ color: '#6B7280', fontSize: 10 }, style]}>{name}</Text>;

const MiniQRCode: React.FC<{ value: string; size: number }> = ({ value, size }) => {
    const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);

    useEffect(() => {
        const generateQR = async () => {
            if (!value) return;
            try {
                const url = await toDataURL(value, {
                    width: size,
                    margin: 0,
                    color: { dark: '#374151' } // A dark gray color
                });
                setQrDataUrl(url);
            } catch (err) {
                console.error('Failed to generate mini QR code', err);
            }
        };
        generateQR();
    }, [value, size]);

    return (
        <View style={{ width: size, height: size }}>
            {qrDataUrl ? (
                <Image source={{ uri: qrDataUrl }} style={{ width: size, height: size }} />
            ) : (
                <View style={{ flex: 1, backgroundColor: '#E5E7EB' }} />
            )}
        </View>
    );
};

interface BookingCardProps {
  ticket: any;
  isPast?: boolean;
  onPress?: () => void;
}

const BookingCard: React.FC<BookingCardProps> = ({ ticket, isPast, onPress }) => {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} disabled={!onPress}>
      <View style={styles.topRow}>
          {ticket.logoUrl ? 
            <Image source={{ uri: ticket.logoUrl }} style={styles.logo} /> : 
            <View style={styles.logoPlaceholder} />
          }
          <View style={styles.routeContainer}>
            <Text style={styles.location}>{ticket.from}</Text>
            <Icon name="-->" style={styles.arrowIcon}/>
            <Text style={styles.location}>{ticket.to}</Text>
          </View>
      </View>
      <Text style={styles.company}>{ticket.company}</Text>

      <View style={styles.detailsContainer}>
        <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailText}>{ticket.date}</Text>
        </View>
         <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Time</Text>
            <Text style={styles.detailText}>{ticket.time}</Text>
        </View>
        <View style={styles.detailItem}>
            <Text style={styles.detailLabel}>Seats</Text>
            <Text style={styles.detailText}>{ticket.seats}</Text>
        </View>
      </View>
      
      <View style={styles.qrCodePlaceholder}>
        {!isPast && <MiniQRCode value={ticket.qrValue} size={48} />}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
    position: 'relative',
    paddingRight: 76, // Increased paddingRight to accommodate the QR code area
  },
  topRow: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: 4,
  },
  logo: {
      width: 32,
      height: 32,
      borderRadius: 16,
      marginRight: 12,
      resizeMode: 'contain',
  },
  logoPlaceholder: {
      width: 32,
      height: 32,
      borderRadius: 16,
      backgroundColor: '#F3F4F6',
      marginRight: 12,
  },
  routeContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  location: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  arrowIcon: {
      marginHorizontal: 8,
      fontSize: 14,
      color: '#9CA3AF'
  },
  company: {
      fontSize: 14,
      color: '#6B7280',
      marginLeft: 44, // Align with route text
      marginBottom: 12,
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingTop: 12,
  },
  detailItem: {
    alignItems: 'flex-start',
  },
  detailLabel: {
      fontSize: 10,
      color: '#9CA3AF',
      textTransform: 'uppercase'
  },
  detailText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginTop: 2,
  },
  qrCodePlaceholder: {
    position: 'absolute',
    right: 0,
    top: 0,
    width: 76,
    height: '100%',
    backgroundColor: '#F9FAFB',
    justifyContent: 'center',
    alignItems: 'center',
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
    borderLeftWidth: 1,
    borderLeftColor: '#E5E7EB'
  },
});

export default BookingCard;