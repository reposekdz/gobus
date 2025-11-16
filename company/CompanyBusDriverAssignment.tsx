import React, { useState, useEffect } from 'react';
import { BusIcon, UserIcon, MapPinIcon, RouteIcon, CalendarIcon, CheckCircleIcon, XCircleIcon } from '../components/icons';
import Modal from '../components/Modal';
import * as api from '../services/apiService';
import LoadingSpinner from '../components/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';

interface BusDriverAssignmentProps {
  companyId: string;
}

interface Assignment {
  id: number;
  bus_id: number;
  driver_id: number;
  route_id?: number;
  bus_station_id?: number;
  assignment_type: 'route' | 'station' | 'general';
  start_date: string;
  end_date?: string;
  status: string;
  bus_plate: string;
  driver_name: string;
  route_name?: string;
  station_name?: string;
  notes?: string;
}

const CompanyBusDriverAssignment: React.FC<BusDriverAssignmentProps> = ({ companyId }) => {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [buses, setBuses] = useState<any[]>([]);
  const [drivers, setDrivers] = useState<any[]>([]);
  const [routes, setRoutes] = useState<any[]>([]);
  const [stations, setStations] = useState<any[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    bus_id: '',
    driver_id: '',
    assignment_type: 'general' as 'route' | 'station' | 'general',
    route_id: '',
    bus_station_id: '',
    start_date: new Date().toISOString().split('T')[0],
    end_date: '',
    notes: ''
  });

  useEffect(() => {
    fetchAllData();
  }, []);

  const fetchAllData = async () => {
    setIsLoading(true);
    try {
      const [busesData, driversData, routesData, assignmentsData] = await Promise.all([
        api.companyGetMyBuses(),
        api.companyGetMyDrivers(),
        api.companyGetMyRoutes(),
        fetchAssignments()
      ]);

      setBuses(busesData);
      setDrivers(driversData);
      setRoutes(routesData);
      setAssignments(assignmentsData);

      // Fetch stations if needed
      const cities = await api.getCities();
      const allStations: any[] = [];
      for (const city of cities) {
        try {
          const cityStations = await api.getBusStationsByCity(city.id);
          if (Array.isArray(cityStations)) {
            allStations.push(...cityStations);
          }
        } catch (e) {
          console.error(`Failed to fetch stations for city ${city.id}`, e);
        }
      }
      setStations(allStations);
    } catch (err: any) {
      setError(err.message || 'Failed to load data');
      toast.error(err.message || 'Failed to load data');
    } finally {
      setIsLoading(false);
    }
  };

  const fetchAssignments = async (): Promise<Assignment[]> => {
    try {
      const data = await api.companyGetBusAssignments();
      return Array.isArray(data) ? data : [];
    } catch (err) {
      console.error('Failed to fetch assignments', err);
      return [];
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const payload: any = {
        bus_id: parseInt(formData.bus_id),
        driver_id: parseInt(formData.driver_id),
        assignment_type: formData.assignment_type,
        start_date: formData.start_date,
        notes: formData.notes || undefined
      };

      if (formData.assignment_type === 'route' && formData.route_id) {
        payload.route_id = parseInt(formData.route_id);
      } else if (formData.assignment_type === 'station' && formData.bus_station_id) {
        payload.bus_station_id = parseInt(formData.bus_station_id);
      }

      if (formData.end_date) {
        payload.end_date = formData.end_date;
      }

      const response = await api.companyCreateBusAssignment(payload);

      if (response.success) {
        toast.success('Bus assigned to driver successfully!');
        setIsModalOpen(false);
        setFormData({
          bus_id: '',
          driver_id: '',
          assignment_type: 'general',
          route_id: '',
          bus_station_id: '',
          start_date: new Date().toISOString().split('T')[0],
          end_date: '',
          notes: ''
        });
        fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to create assignment');
      }
    } catch (err: any) {
      const errorMsg = err.message || 'Failed to create assignment';
      setError(errorMsg);
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleEndAssignment = async (assignmentId: number) => {
    if (!confirm('Are you sure you want to end this assignment?')) return;

    setIsLoading(true);
    try {
      const response = await api.companyEndBusAssignment(assignmentId);
      if (response.success) {
        toast.success('Assignment ended successfully');
        fetchAllData();
      } else {
        throw new Error(response.message || 'Failed to end assignment');
      }
    } catch (err: any) {
      toast.error(err.message || 'Failed to end assignment');
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading && assignments.length === 0) {
    return <LoadingSpinner />;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold dark:text-white mb-2">Bus & Driver Assignments</h1>
          <p className="text-gray-600 dark:text-gray-400">
            Assign buses to drivers based on routes or bus stations
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg"
        >
          <BusIcon className="w-5 h-5 mr-2" />
          New Assignment
        </button>
      </div>

      {error && (
        <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total Assignments</p>
              <p className="text-3xl font-bold dark:text-white">{assignments.length}</p>
            </div>
            <BusIcon className="w-12 h-12 text-blue-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Active Assignments</p>
              <p className="text-3xl font-bold dark:text-white">
                {assignments.filter(a => a.status === 'active').length}
              </p>
            </div>
            <CheckCircleIcon className="w-12 h-12 text-green-500 opacity-50" />
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-md">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Available Buses</p>
              <p className="text-3xl font-bold dark:text-white">
                {buses.filter(b => b.status === 'active' || b.status === 'Operational').length}
              </p>
            </div>
            <BusIcon className="w-12 h-12 text-yellow-500 opacity-50" />
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Bus</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Driver</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Assignment Type</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Route/Station</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Start Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">End Date</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Status</th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {assignments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                    No assignments found. Create your first assignment to get started.
                  </td>
                </tr>
              ) : (
                assignments.map((assignment) => (
                  <tr key={assignment.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <BusIcon className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="font-semibold dark:text-white">{assignment.bus_plate}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center">
                        <UserIcon className="w-5 h-5 mr-2 text-gray-400" />
                        <span className="dark:text-white">{assignment.driver_name}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        assignment.assignment_type === 'route' 
                          ? 'bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300'
                          : assignment.assignment_type === 'station'
                          ? 'bg-purple-100 text-purple-800 dark:bg-purple-900/50 dark:text-purple-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {assignment.assignment_type.charAt(0).toUpperCase() + assignment.assignment_type.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignment.route_name ? (
                        <div className="flex items-center">
                          <RouteIcon className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="dark:text-white">{assignment.route_name}</span>
                        </div>
                      ) : assignment.station_name ? (
                        <div className="flex items-center">
                          <MapPinIcon className="w-4 h-4 mr-1 text-gray-400" />
                          <span className="dark:text-white">{assignment.station_name}</span>
                        </div>
                      ) : (
                        <span className="text-gray-400 dark:text-gray-500">General</span>
                      )}
                    </td>
                    <td className="px-6 py-4 dark:text-white">
                      {new Date(assignment.start_date).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 dark:text-white">
                      {assignment.end_date ? new Date(assignment.end_date).toLocaleDateString() : 'Ongoing'}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        assignment.status === 'active'
                          ? 'bg-green-100 text-green-800 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                      }`}>
                        {assignment.status.charAt(0).toUpperCase() + assignment.status.slice(1)}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {assignment.status === 'active' && (
                        <button
                          onClick={() => handleEndAssignment(assignment.id)}
                          className="px-3 py-1 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 font-semibold"
                        >
                          End
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Assign Bus to Driver"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Bus <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.bus_id}
              onChange={(e) => setFormData({ ...formData, bus_id: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Choose a bus...</option>
              {buses
                .filter(b => b.status === 'active' || b.status === 'Operational')
                .map(bus => (
                  <option key={bus.id} value={bus.id}>
                    {bus.plate_number} - {bus.model} ({bus.capacity} seats)
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Select Driver <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.driver_id}
              onChange={(e) => setFormData({ ...formData, driver_id: e.target.value })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="">Choose a driver...</option>
              {drivers
                .filter(d => d.status === 'Active')
                .map(driver => (
                  <option key={driver.id} value={driver.id}>
                    {driver.name} - {driver.phone}
                  </option>
                ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Assignment Type <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.assignment_type}
              onChange={(e) => setFormData({ 
                ...formData, 
                assignment_type: e.target.value as 'route' | 'station' | 'general',
                route_id: '',
                bus_station_id: ''
              })}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              required
            >
              <option value="general">General Assignment</option>
              <option value="route">Route-Based Assignment</option>
              <option value="station">Station-Based Assignment</option>
            </select>
          </div>

          {formData.assignment_type === 'route' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Route <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.route_id}
                onChange={(e) => setFormData({ ...formData, route_id: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Choose a route...</option>
                {routes
                  .filter(r => r.status === 'Active')
                  .map(route => (
                    <option key={route.id} value={route.id}>
                      {route.from} → {route.to}
                    </option>
                  ))}
              </select>
            </div>
          )}

          {formData.assignment_type === 'station' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select Bus Station <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.bus_station_id}
                onChange={(e) => setFormData({ ...formData, bus_station_id: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              >
                <option value="">Choose a station...</option>
                {stations.map(station => (
                  <option key={station.id} value={station.id}>
                    {station.name} {station.cityId ? `(${station.cityId})` : ''}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                End Date (Optional)
              </label>
              <input
                type="date"
                value={formData.end_date}
                onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                min={formData.start_date}
                className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Notes (Optional)
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              className="w-full p-3 border rounded-lg dark:bg-gray-700 dark:border-gray-600 dark:text-white"
              placeholder="Add any additional notes about this assignment..."
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-6 py-3 border border-gray-300 dark:border-gray-600 rounded-lg font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-blue-800 transition-all shadow-lg disabled:opacity-50"
            >
              {isLoading ? 'Creating...' : 'Create Assignment'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default CompanyBusDriverAssignment;

