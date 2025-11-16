import { pool } from '../../config/db';
import * as mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const tables = [
    'seats', 'wallet_transactions', 'wallets', 'bookings', 'trips',
    'routes', 'buses', 'companies', 'users', 'messages', 'site_settings', 'featured_destinations'
];

const clearDatabase = async (connection: mysql.PoolConnection) => {
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    for (const table of tables) {
        // Add a check to see if table exists before truncating
        const [rows] = await connection.query(`SHOW TABLES LIKE '${table}'`);
        if ((rows as any[]).length > 0) {
            await connection.query(`TRUNCATE TABLE ${table};`);
        }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
};

export const seedDatabase = async () => {
    const connection = await pool.getConnection();
    try {
        console.log('Clearing database...');
        await clearDatabase(connection);
        console.log('Database cleared.');

        console.log('Seeding data...');

        // 1. Create Users
        const password_hash = await bcrypt.hash('password', 10);
        
        const [passengerResult] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES ('Kalisa Jean', 'passenger@gobus.rw', ?, 'passenger', 'https://randomuser.me/api/portraits/men/32.jpg')", [password_hash]);
        const passengerId = passengerResult.insertId;

        const [volcanoManagerResult] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role) VALUES ('Volcano Manager', 'company@gobus.rw', ?, 'company')", [password_hash]);
        const volcanoManagerId = volcanoManagerResult.insertId;
        
        const [ritcoManagerResult] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role) VALUES ('RITCO Manager', 'company2@gobus.rw', ?, 'company')", [password_hash]);
        const ritcoManagerId = ritcoManagerResult.insertId;

        const [driver1Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES ('John Doe', 'driver1@gobus.rw', ?, 'driver', 'https://randomuser.me/api/portraits/men/4.jpg')", [password_hash]);
        const driver1Id = driver1Result.insertId;

        const [driver2Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES ('Mary Anne', 'driver2@gobus.rw', ?, 'driver', 'https://randomuser.me/api/portraits/women/6.jpg')", [password_hash]);
        const driver2Id = driver2Result.insertId;
        
        await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, avatar_url) VALUES ('Admin User', 'admin@gobus.rw', ?, 'admin', 'https://randomuser.me/api/portraits/women/44.jpg')", [password_hash]);

        // Wallets
        await connection.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [passengerId, 50000]);

        // 2. Create Companies
        const [volcanoResult] = await connection.query<mysql.ResultSetHeader>("INSERT INTO companies (name, owner_id, status, logo_url, cover_url) VALUES ('Volcano Express', ?, 'Active', 'https://pbs.twimg.com/profile_images/1237839357116452865/p-28c8o-_400x400.jpg', 'https://images.unsplash.com/photo-1593256398246-8853b3815c32?q=80&w=2070&auto=format&fit=crop')", [volcanoManagerId]);
        const volcanoId = volcanoResult.insertId;

        const [ritcoResult] = await connection.query<mysql.ResultSetHeader>("INSERT INTO companies (name, owner_id, status, logo_url, cover_url) VALUES ('RITCO', ?, 'Active', 'https://www.ritco.rw/wp-content/uploads/2021/04/ritco-logo.jpg', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2048&auto=format&fit=crop')", [ritcoManagerId]);
        const ritcoId = ritcoResult.insertId;

        await connection.query('UPDATE users SET company_id = ? WHERE id IN (?, ?)', [volcanoId, volcanoManagerId, driver1Id]);
        await connection.query('UPDATE users SET company_id = ? WHERE id = ?', [ritcoId, ritcoManagerId]);
        await connection.query('UPDATE users SET company_id = ? WHERE id = ?', [ritcoId, driver2Id]);
        
        // 3. Create Buses
        const [bus1Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO buses (company_id, plate_number, model, capacity, amenities) VALUES (?, 'RAD 123 B', 'Yutong Explorer', 55, '[\"AC\", \"Charging\"]')", [volcanoId]);
        const bus1Id = bus1Result.insertId;

        const [bus2Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO buses (company_id, plate_number, model, capacity, amenities) VALUES (?, 'RAE 456 C', 'Scania Marcopolo', 65, '[\"AC\", \"WiFi\", \"TV\"]')", [ritcoId]);
        const bus2Id = bus2Result.insertId;

        // 4. Create Routes
        const [route1Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes) VALUES (?, 'Kigali', 'Rubavu', 4500, 210)", [volcanoId]);
        const route1Id = route1Result.insertId;

        const [route2Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes) VALUES (?, 'Kigali', 'Huye', 3000, 150)", [ritcoId]);
        const route2Id = route2Result.insertId;

        // 5. Create Trips
        const today = new Date();
        const departure1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0);
        const arrival1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 30, 0);
        const [trip1Result] = await connection.query<mysql.ResultSetHeader>("INSERT INTO trips (route_id, bus_id, driver_id, departure_time, arrival_time) VALUES (?, ?, ?, ?, ?)", [route1Id, bus1Id, driver1Id, departure1, arrival1]);

        const departure2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30, 0);
        const arrival2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 0, 0);
        await connection.query("INSERT INTO trips (route_id, bus_id, driver_id, departure_time, arrival_time) VALUES (?, ?, ?, ?, ?)", [route2Id, bus2Id, driver2Id, departure2, arrival2]);
        
        // 6. Site Settings & Destinations
        await connection.query("INSERT INTO site_settings (setting_key, setting_value) VALUES ('hero_image', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2048&auto=format&fit=crop')");
        await connection.query("INSERT INTO featured_destinations (from_location, to_location, price, image_data_uri) VALUES ('Kigali', 'Rubavu', 4500, 'https://images.unsplash.com/photo-1590632313655-e9c5220c4273?q=80&w=2070&auto=format&fit=crop')");
        await connection.query("INSERT INTO featured_destinations (from_location, to_location, price, image_data_uri) VALUES ('Kigali', 'Musanze', 3500, 'https://www.andbeyond.com/wp-content/uploads/sites/5/one-of-the-reasons-to-visit-rwanda-gorilla.jpg')");


        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seeding failed:', error);
        await connection.rollback();
    } finally {
        connection.release();
    }
};