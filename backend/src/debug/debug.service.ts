import { pool } from '../config/db';
import * as mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

// A function to execute the schema.mysql.txt file
const createSchema = async (connection: mysql.PoolConnection) => {
    // FIX: Cast `process` to `any` to access `cwd()` and resolve path, avoiding type errors when node types are not fully loaded.
    const schemaPath = path.join((process as any).cwd(), 'backend', 'src', 'debug', 'schema.mysql.txt');
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    // Split by semicolon, but be careful of semicolons inside statements
    const statements = schemaSql.split(/;\s*$/m);
    for (const statement of statements) {
        if (statement.trim().length > 3) {
            await connection.query(statement);
        }
    }
};

const clearDatabase = async (connection: mysql.PoolConnection) => {
    const [rows] = await connection.query<any[] & mysql.RowDataPacket[]>("SHOW TABLES");
    const tables = rows.map(row => Object.values(row)[0]);
    
    await connection.query('SET FOREIGN_KEY_CHECKS = 0;');
    for (const table of tables) {
        try {
            await connection.query(`DROP TABLE IF EXISTS \`${table}\`;`);
        } catch (e: any) {
            console.warn(`Could not drop table ${table}:`, e.message);
        }
    }
    await connection.query('SET FOREIGN_KEY_CHECKS = 1;');
};


export const seedDatabase = async () => {
    const connection = await pool.getConnection();
    try {
        await connection.beginTransaction();
        
        console.log('Clearing database...');
        await clearDatabase(connection);
        console.log('Database cleared.');
        
        console.log('Creating schema from schema.mysql.txt...');
        await createSchema(connection);
        console.log('Schema created.');

        console.log('Seeding data...');

        // 1. Create Users
        const password_hash = await bcrypt.hash('password', 10);
        const pin_hash = await bcrypt.hash('1234', 10);
        
        const [passengerRes] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, avatar_url, pin, serial_code, loyalty_points) VALUES ('Kalisa Jean', 'passenger@gobus.rw', ?, 'passenger', 'https://randomuser.me/api/portraits/men/32.jpg', ?, 'KAL1234', 1250)", [password_hash, pin_hash]);
        const passengerId = passengerRes.insertId;

        const [volcanoManagerRes] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, pin, serial_code) VALUES ('Volcano Manager', 'company@gobus.rw', ?, 'company', ?, 'VOL5678')", [password_hash, pin_hash]);
        const volcanoManagerId = volcanoManagerRes.insertId;
        
        const [ritcoManagerRes] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, pin, serial_code) VALUES ('RITCO Manager', 'company2@gobus.rw', ?, 'company', ?, 'RIT9012')", [password_hash, pin_hash]);
        const ritcoManagerId = ritcoManagerRes.insertId;
        
        await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, serial_code) VALUES ('Admin User', 'admin@gobus.rw', ?, 'admin', 'ADM3456')", [password_hash]);

        // Wallets
        await connection.query('INSERT INTO wallets (user_id, balance) VALUES (?, ?)', [passengerId, 50000]);

        // 2. Create Companies
        const [volcanoRes] = await connection.query<mysql.ResultSetHeader>("INSERT INTO companies (name, owner_id, status, logo_url, cover_url, description) VALUES ('Volcano Express', ?, 'Active', 'https://pbs.twimg.com/profile_images/1237839357116452865/p-28c8o-_400x400.jpg', 'https://images.unsplash.com/photo-1593256398246-8853b3815c32?q=80&w=2070&auto=format&fit=crop', 'Volcano Express is one of the most popular transport companies in Rwanda, known for its excellent service, cleanliness, and punctuality, serving many major routes.')", [volcanoManagerId]);
        const volcanoId = volcanoRes.insertId;

        const [ritcoRes] = await connection.query<mysql.ResultSetHeader>("INSERT INTO companies (name, owner_id, status, logo_url, cover_url, description) VALUES ('RITCO', ?, 'Active', 'https://www.ritco.rw/wp-content/uploads/2021/04/ritco-logo.jpg', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2048&auto=format&fit=crop', 'RITCO is a government-owned public transport company, known for its large and modern fleet that serves routes across the entire country.')", [ritcoManagerId]);
        const ritcoId = ritcoRes.insertId;

        await connection.query('UPDATE users SET company_id = ? WHERE id = ?', [volcanoId, volcanoManagerId]);
        await connection.query('UPDATE users SET company_id = ? WHERE id = ?', [ritcoId, ritcoManagerId]);

        // 3. Create Drivers
        const [driver1Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, company_id, avatar_url, serial_code) VALUES ('John Doe', 'driver@gobus.rw', ?, 'driver', ?, 'https://randomuser.me/api/portraits/men/4.jpg', 'JOH7890')", [password_hash, volcanoId]);
        const driver1Id = driver1Res.insertId;
        const [driver2Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO users (name, email, password_hash, role, company_id, avatar_url, serial_code) VALUES ('Mary Anne', 'driver2@gobus.rw', ?, 'driver', ?, 'https://randomuser.me/api/portraits/women/6.jpg', 'MAR1122')", [password_hash, ritcoId]);
        const driver2Id = driver2Res.insertId;

        // 4. Create Buses
        const [bus1Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO buses (company_id, plate_number, model, capacity, amenities, image_url) VALUES (?, 'RAD 123 B', 'Yutong Explorer', 55, 'AC,Charging', 'https://www.yutong.com/ar/products/conventional/coach/zk6127h/images/ZK6127H_1.jpg')", [volcanoId]);
        const bus1Id = bus1Res.insertId;
        const [bus2Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO buses (company_id, plate_number, model, capacity, amenities, image_url) VALUES (?, 'RAE 456 C', 'Scania Marcopolo', 65, 'AC,WiFi,TV', 'https://busdigital.com.br/wp-content/uploads/2020/07/2-Volcano-Bus-Carroceria-Marcopolo-G7.jpg')", [ritcoId]);
        const bus2Id = bus2Res.insertId;

        await connection.query('UPDATE users SET assigned_bus_id = ? WHERE id = ?', [bus1Id, driver1Id]);
        
        // 5. Create Routes
        const [route1Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes) VALUES (?, 'Kigali', 'Rubavu', 4500, 210)", [volcanoId]);
        const route1Id = route1Res.insertId;
        const [route2Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes) VALUES (?, 'Kigali', 'Huye', 3000, 150)", [ritcoId]);
        const route2Id = route2Res.insertId;
        const [route3Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO routes (company_id, origin, destination, base_price, estimated_duration_minutes) VALUES (?, 'Kigali', 'Musanze', 3500, 120)", [volcanoId]);
        const route3Id = route3Res.insertId;

        // 6. Create Trips
        const today = new Date();
        const departure1 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0, 0);
        const arrival1 = new Date(departure1.getTime() + 210 * 60000);
        const [trip1Res] = await connection.query<mysql.ResultSetHeader>("INSERT INTO trips (route_id, bus_id, driver_id, departure_time, arrival_time) VALUES (?, ?, ?, ?, ?)", [route1Id, bus1Id, driver1Id, departure1, arrival1]);
        const trip1Id = trip1Res.insertId;

        const departure2 = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30, 0);
        const arrival2 = new Date(departure2.getTime() + 150 * 60000);
        await connection.query("INSERT INTO trips (route_id, bus_id, driver_id, departure_time, arrival_time) VALUES (?, ?, ?, ?, ?)", [route2Id, bus2Id, driver2Id, departure2, arrival2]);
        
        // 7. Site Settings, Reviews, and other new tables
        await connection.query("INSERT INTO site_settings (setting_key, setting_value) VALUES ('hero_image', 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?q=80&w=2048&auto=format&fit=crop')");
        await connection.query("INSERT INTO reviews (company_id, user_id, rating, comment) VALUES (?, ?, ?, ?)", [volcanoId, passengerId, 5, 'Nta kundi navuga, Volcano ni abahanga! Buri gihe serivisi ni nziza.']);
        await connection.query("INSERT INTO price_alerts (user_id, origin, destination, initial_price) VALUES (?, 'Kigali', 'Rubavu', 4500)", [passengerId]);
        await connection.query("INSERT INTO lost_and_found (item_name, date_found, route_found_on, location_stored) VALUES ('Black Backpack', '2024-10-27', 'Kigali - Huye', 'Nyabugogo Office')");

        // 8. Create a Booking to test boarding
        const [bookingRes] = await connection.query<mysql.ResultSetHeader>("INSERT INTO bookings (user_id, trip_id, booking_id, total_price, status, payment_method) VALUES (?, ?, ?, ?, ?, ?)", [passengerId, trip1Id, 'GB-TEST1', 4500, 'Confirmed', 'wallet']);
        const bookingId = bookingRes.insertId;
        await connection.query("INSERT INTO seats (booking_id, trip_id, seat_number) VALUES (?, ?, ?)", [bookingId, trip1Id, 'A5']);
        await connection.query("INSERT INTO loyalty_transactions (user_id, points, type, description, related_booking_id) VALUES (?, ?, 'earn', 'Trip to Rubavu', ?)", [passengerId, 45, bookingId]);

        await connection.commit();
        console.log('Seeding complete.');
    } catch (error) {
        console.error('Seeding failed:', error);
        await connection.rollback();
    } finally {
        connection.release();
    }
};