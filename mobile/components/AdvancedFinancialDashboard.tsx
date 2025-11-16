import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, TouchableOpacity, Dimensions } from 'react-native';
import { LineChart, BarChart, PieChart } from 'react-native-chart-kit';
import { Ionicons } from '@expo/vector-icons';
import { Card } from './Card';

interface FinancialData {
  revenue: {
    today_revenue: number;
    week_revenue: number;
    month_revenue: number;
    total_revenue: number;
  };
  walletBalance: number;
  pendingWithdrawals: {
    pending_amount: number;
    pending_count: number;
  };
  topRoutes: Array<{
    origin: string;
    destination: string;
    revenue: number;
    bookings: number;
  }>;
}

interface AnalyticsData {
  dailyRevenue: Array<{
    date: string;
    gross_revenue: number;
    net_revenue: number;
    bookings: number;
  }>;
  paymentMethods: Array<{
    payment_method: string;
    revenue: number;
    transactions: number;
  }>;
  busPerformance: Array<{
    license_plate: string;
    model: string;
    revenue: number;
    trips: number;
  }>;
}

const screenWidth = Dimensions.get('window').width;

const AdvancedFinancialDashboard: React.FC = () => {
  const [financialData, setFinancialData] = useState<FinancialData | null>(null);
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30');

  useEffect(() => {
    loadFinancialData();
    loadAnalyticsData();
  }, [period]);

  const loadFinancialData = async () => {
    try {
      const response = await fetch('/api/companies/financial-dashboard');
      const data = await response.json();
      setFinancialData(data);
    } catch (error) {
      console.error('Error loading financial data:', error);
    }
  };

  const loadAnalyticsData = async () => {
    try {
      const response = await fetch(`/api/companies/revenue-analytics?period=${period}`);
      const data = await response.json();
      setAnalyticsData(data);
    } catch (error) {
      console.error('Error loading analytics data:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const getRevenueChartData = () => {
    if (!analyticsData?.dailyRevenue) return null;

    const last7Days = analyticsData.dailyRevenue.slice(0, 7).reverse();
    
    return {
      labels: last7Days.map(item => new Date(item.date).toLocaleDateString('en', { weekday: 'short' })),
      datasets: [
        {
          data: last7Days.map(item => item.net_revenue),
          color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
          strokeWidth: 2
        }
      ]
    };
  };

  const getPaymentMethodsChartData = () => {
    if (!analyticsData?.paymentMethods) return null;

    const colors = ['#2563eb', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];
    
    return analyticsData.paymentMethods.map((method, index) => ({
      name: method.payment_method,
      revenue: method.revenue,
      color: colors[index % colors.length],
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));
  };

  const getBusPerformanceChartData = () => {
    if (!analyticsData?.busPerformance) return null;

    const top5Buses = analyticsData.busPerformance.slice(0, 5);
    
    return {
      labels: top5Buses.map(bus => bus.license_plate),
      datasets: [
        {
          data: top5Buses.map(bus => bus.revenue)
        }
      ]
    };
  };

  const renderOverviewTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Key Metrics Cards */}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: 20 }}>
        <View style={{ width: '48%', marginRight: '2%', marginBottom: 15 }}>
          <Card style={{ padding: 15, backgroundColor: '#2563eb' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="wallet" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 10, fontSize: 16, fontWeight: 'bold' }}>
                Wallet Balance
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {formatCurrency(financialData?.walletBalance || 0)}
            </Text>
          </Card>
        </View>

        <View style={{ width: '48%', marginLeft: '2%', marginBottom: 15 }}>
          <Card style={{ padding: 15, backgroundColor: '#10b981' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="trending-up" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 10, fontSize: 16, fontWeight: 'bold' }}>
                Today's Revenue
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {formatCurrency(financialData?.revenue.today_revenue || 0)}
            </Text>
          </Card>
        </View>

        <View style={{ width: '48%', marginRight: '2%', marginBottom: 15 }}>
          <Card style={{ padding: 15, backgroundColor: '#f59e0b' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="calendar" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 10, fontSize: 16, fontWeight: 'bold' }}>
                This Week
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {formatCurrency(financialData?.revenue.week_revenue || 0)}
            </Text>
          </Card>
        </View>

        <View style={{ width: '48%', marginLeft: '2%', marginBottom: 15 }}>
          <Card style={{ padding: 15, backgroundColor: '#ef4444' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 10 }}>
              <Ionicons name="hourglass" size={24} color="white" />
              <Text style={{ color: 'white', marginLeft: 10, fontSize: 16, fontWeight: 'bold' }}>
                Pending
              </Text>
            </View>
            <Text style={{ color: 'white', fontSize: 20, fontWeight: 'bold' }}>
              {formatCurrency(financialData?.pendingWithdrawals.pending_amount || 0)}
            </Text>
          </Card>
        </View>
      </View>

      {/* Revenue Trend Chart */}
      <Card style={{ padding: 15, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Revenue Trend (7 Days)</Text>
        {getRevenueChartData() && (
          <LineChart
            data={getRevenueChartData()!}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(37, 99, 235, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
              style: { borderRadius: 16 },
              propsForDots: {
                r: '6',
                strokeWidth: '2',
                stroke: '#2563eb'
              }
            }}
            bezier
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        )}
      </Card>

      {/* Top Routes */}
      <Card style={{ padding: 15, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Top Performing Routes</Text>
        {financialData?.topRoutes.map((route, index) => (
          <View key={index} style={{ 
            flexDirection: 'row', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            paddingVertical: 10,
            borderBottomWidth: index < financialData.topRoutes.length - 1 ? 1 : 0,
            borderBottomColor: '#e2e8f0'
          }}>
            <View style={{ flex: 1 }}>
              <Text style={{ fontWeight: 'bold', fontSize: 16 }}>
                {route.origin} → {route.destination}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 14 }}>
                {route.bookings} bookings
              </Text>
            </View>
            <Text style={{ fontWeight: 'bold', color: '#10b981', fontSize: 16 }}>
              {formatCurrency(route.revenue)}
            </Text>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  const renderAnalyticsTab = () => (
    <ScrollView showsVerticalScrollIndicator={false}>
      {/* Period Selector */}
      <View style={{ flexDirection: 'row', marginBottom: 20 }}>
        {['7', '30', '90'].map((days) => (
          <TouchableOpacity
            key={days}
            style={{
              flex: 1,
              padding: 10,
              marginHorizontal: 5,
              backgroundColor: period === days ? '#2563eb' : '#e2e8f0',
              borderRadius: 8,
              alignItems: 'center'
            }}
            onPress={() => setPeriod(days)}
          >
            <Text style={{ 
              color: period === days ? 'white' : '#64748b',
              fontWeight: period === days ? 'bold' : 'normal'
            }}>
              {days} Days
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Payment Methods Distribution */}
      <Card style={{ padding: 15, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Payment Methods</Text>
        {getPaymentMethodsChartData() && (
          <PieChart
            data={getPaymentMethodsChartData()!}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor="revenue"
            backgroundColor="transparent"
            paddingLeft="15"
            absolute
          />
        )}
      </Card>

      {/* Bus Performance */}
      <Card style={{ padding: 15, marginBottom: 20 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Top Performing Buses</Text>
        {getBusPerformanceChartData() && (
          <BarChart
            data={getBusPerformanceChartData()!}
            width={screenWidth - 60}
            height={220}
            chartConfig={{
              backgroundColor: '#ffffff',
              backgroundGradientFrom: '#ffffff',
              backgroundGradientTo: '#ffffff',
              decimalPlaces: 0,
              color: (opacity = 1) => `rgba(16, 185, 129, ${opacity})`,
              labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            style={{ marginVertical: 8, borderRadius: 16 }}
          />
        )}
      </Card>

      {/* Detailed Analytics */}
      <Card style={{ padding: 15 }}>
        <Text style={{ fontSize: 18, fontWeight: 'bold', marginBottom: 15 }}>Daily Breakdown</Text>
        {analyticsData?.dailyRevenue.slice(0, 7).map((day, index) => (
          <View key={index} style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            paddingVertical: 12,
            borderBottomWidth: index < 6 ? 1 : 0,
            borderBottomColor: '#e2e8f0'
          }}>
            <View>
              <Text style={{ fontWeight: 'bold' }}>
                {new Date(day.date).toLocaleDateString()}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                {day.bookings} bookings
              </Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{ fontWeight: 'bold', color: '#10b981' }}>
                {formatCurrency(day.net_revenue)}
              </Text>
              <Text style={{ color: '#64748b', fontSize: 12 }}>
                Gross: {formatCurrency(day.gross_revenue)}
              </Text>
            </View>
          </View>
        ))}
      </Card>
    </ScrollView>
  );

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text>Loading financial data...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View style={{ padding: 20, paddingBottom: 10 }}>
        <Text style={{ fontSize: 24, fontWeight: 'bold', marginBottom: 10 }}>
          Financial Dashboard
        </Text>
        
        {/* Tab Navigation */}
        <View style={{ flexDirection: 'row', marginBottom: 20 }}>
          {['overview', 'analytics'].map((tab) => (
            <TouchableOpacity
              key={tab}
              style={{
                flex: 1,
                padding: 12,
                marginHorizontal: 5,
                backgroundColor: activeTab === tab ? '#2563eb' : '#e2e8f0',
                borderRadius: 8,
                alignItems: 'center'
              }}
              onPress={() => setActiveTab(tab)}
            >
              <Text style={{
                color: activeTab === tab ? 'white' : '#64748b',
                fontWeight: activeTab === tab ? 'bold' : 'normal'
              }}>
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* Tab Content */}
      <View style={{ flex: 1, paddingHorizontal: 20 }}>
        {activeTab === 'overview' ? renderOverviewTab() : renderAnalyticsTab()}
      </View>
    </View>
  );
};

export default AdvancedFinancialDashboard;