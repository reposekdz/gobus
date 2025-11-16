import * as adminService from './admin.service';
import * as driverService from '../drivers/driver.service';
import asyncHandler from '../../utils/asyncHandler';

// Company Controllers
export const createCompany = asyncHandler(async (req, res) => {
    const company = await adminService.createCompany(req.body);
    res.status(201).json({ success: true, data: company });
});

export const getCompanies = asyncHandler(async (req, res) => {
    const companies = await adminService.getAllCompanies();
    res.status(200).json({ success: true, count: (companies as any[]).length, data: companies });
});

export const updateCompany = asyncHandler(async (req, res) => {
    const company = await adminService.updateCompanyById(req.params.id, req.body);
    res.status(200).json({ success: true, data: company });
});

export const deleteCompany = asyncHandler(async (req, res) => {
    await adminService.deleteCompanyById(req.params.id);
    res.status(200).json({ success: true, data: {} });
});


// Driver Controllers
export const createDriver = asyncHandler(async (req, res) => {
    const driver = await adminService.createDriver(req.body);
    res.status(201).json({ success: true, data: driver });
});

export const getDrivers = asyncHandler(async (req, res) => {
    const drivers = await adminService.getAllDrivers();
    res.status(200).json({ success: true, count: (drivers as any[]).length, data: drivers });
});

export const updateDriver = asyncHandler(async (req, res) => {
    const driver = await adminService.updateDriverById(req.params.id, req.body);
    res.status(200).json({ success: true, data: driver });
});

export const deleteDriver = asyncHandler(async (req, res) => {
    await adminService.deleteDriverById(req.params.id);
    res.status(200).json({ success: true, data: {} });
});

export const getDriverHistoryForAdmin = asyncHandler(async (req, res) => {
    const history = await driverService.getTripHistoryForDriver(parseInt(req.params.id));
    res.status(200).json({ success: true, data: history });
});


// Agent Controllers
export const createAgent = asyncHandler(async (req, res) => {
    const agent = await adminService.createAgent(req.body);
    res.status(201).json({ success: true, data: agent });
});

export const getAgents = asyncHandler(async (req, res) => {
    const agents = await adminService.getAllAgents();
    res.status(200).json({ success: true, count: (agents as any[]).length, data: agents });
});

export const updateAgent = asyncHandler(async (req, res) => {
    const agent = await adminService.updateAgentById(req.params.id, req.body);
    res.status(200).json({ success: true, data: agent });
});

export const deleteAgent = asyncHandler(async (req, res) => {
    await adminService.deleteAgentById(req.params.id);
    res.status(200).json({ success: true, data: {} });
});



// User Controllers
export const getUsers = asyncHandler(async (req, res) => {
    const users = await adminService.getAllUsers();
    res.status(200).json({ success: true, count: (users as any[]).length, data: users });
});

export const getDashboardAnalytics = asyncHandler(async (req, res) => {
    const analytics = await adminService.getDashboardAnalytics();
    res.status(200).json({ success: true, data: analytics });
});

export const getAdminFinancials = asyncHandler(async (req, res) => {
    const data = await adminService.getFinancialsData();
    res.status(200).json({ success: true, data });
});