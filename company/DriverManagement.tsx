import React, { useState, useEffect } from 'react';
import { apiService } from '../lib/api-services';

interface Driver {
  id: number;
  name: string;
  email: string;
  phone_number: string;
  status: string;
  assigned_bus: string;
  total_trips: number;
}

interface Bus {
  id: number;
  plate_number: string;
  model: string;
  capacity: number;
}

export const DriverManagement: React.FC = () => {
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [buses, setBuses] = useState<Bus[]>([]);
  const [showAddForm, setShowAddForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone_number: '',
    license_number: ''
  });

  useEffect(() => {
    fetchDrivers();
    fetchBuses();
  }, []);

  const fetchDrivers = async () => {
    try {
      const response = await apiService.get('/company/drivers');
      setDrivers(response.data.drivers);
    } catch (error) {
      console.error('Failed to fetch drivers:', error);
    }
  };

  const fetchBuses = async () => {
    try {
      const response = await apiService.get('/company/buses');
      setBuses(response.data.buses);
    } catch (error) {
      console.error('Failed to fetch buses:', error);
    }
  };

  const handleAddDriver = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await apiService.post('/company/drivers', formData);
      
      alert(`Driver added successfully!\nEmail: ${response.data.email}\nPassword: ${response.data.password}`);
      
      setFormData({ name: '', email: '', phone_number: '', license_number: '' });
      setShowAddForm(false);
      fetchDrivers();
    } catch (error) {
      alert('Failed to add driver');
    } finally {
      setLoading(false);
    }
  };

  const handleAssignBus = async (driverId: number, busId: number) => {
    try {
      await apiService.post('/company/drivers/assign-bus', {
        driver_id: driverId,
        bus_id: busId
      });
      
      alert('Bus assigned successfully!');
      fetchDrivers();
    } catch (error) {
      alert('Failed to assign bus');
    }
  };

  const handleStatusChange = async (driverId: number, status: string) => {
    try {
      await apiService.put(`/company/drivers/${driverId}/status`, { status });
      alert('Driver status updated!');
      fetchDrivers();
    } catch (error) {
      alert('Failed to update status');
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Driver Management</h1>
        <button
          onClick={() => setShowAddForm(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          Add Driver
        </button>
      </div>

      {/* Add Driver Form */}
      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg w-96">
            <h2 className="text-xl font-bold mb-4">Add New Driver</h2>
            <form onSubmit={handleAddDriver}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({...formData, name: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({...formData, email: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Phone</label>
                <input
                  type="tel"
                  value={formData.phone_number}
                  onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">License Number</label>
                <input
                  type="text"
                  value={formData.license_number}
                  onChange={(e) => setFormData({...formData, license_number: e.target.value})}
                  className="w-full border rounded px-3 py-2"
                  required
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? 'Adding...' : 'Add Driver'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-600"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Drivers Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Assigned Bus</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Total Trips</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200">
            {drivers.map((driver) => (
              <tr key={driver.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {driver.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.email}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.phone_number}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.assigned_bus || (
                    <select
                      onChange={(e) => handleAssignBus(driver.id, parseInt(e.target.value))}
                      className="border rounded px-2 py-1 text-xs"
                    >
                      <option value="">Assign Bus</option>
                      {buses.filter(bus => !drivers.some(d => d.assigned_bus === bus.plate_number)).map(bus => (
                        <option key={bus.id} value={bus.id}>
                          {bus.plate_number} - {bus.model}
                        </option>
                      ))}
                    </select>
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {driver.total_trips}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    driver.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {driver.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  <select
                    value={driver.status}
                    onChange={(e) => handleStatusChange(driver.id, e.target.value)}
                    className="border rounded px-2 py-1 text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Suspended">Suspended</option>
                    <option value="Pending">Pending</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};