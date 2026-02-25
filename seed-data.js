#!/usr/bin/env node
/**
 * Seed Data Script for Sohraa HMS
 * Populates the database with demo data via the API.
 * 
 * Usage: node seed-data.js
 * Requires: Backend running on http://localhost:8080
 */

const BASE_URL = 'https://sohraa-hms-production-803b.up.railway.app';
let cookies = '';

async function request(path, method = 'GET', body = null) {
    const opts = {
        method,
        headers: {
            'Content-Type': 'application/json',
            'Cookie': cookies,
        },
    };
    if (body) opts.body = JSON.stringify(body);

    const res = await fetch(`${BASE_URL}${path}`, opts);

    // Capture cookies
    const setCookies = res.headers.getSetCookie?.() || [];
    if (setCookies.length > 0) {
        const newCookies = setCookies.map(c => c.split(';')[0]).join('; ');
        cookies = newCookies;
    }

    const text = await res.text();
    if (!res.ok) {
        console.error(`  ✗ ${method} ${path} → ${res.status}: ${text.substring(0, 200)}`);
        return null;
    }
    console.log(`  ✓ ${method} ${path} → ${res.status}`);
    return text ? JSON.parse(text) : { success: true };
}

async function main() {
    console.log('═══════════════════════════════════════');
    console.log('  Sohraa HMS — Seed Data Script');
    console.log('═══════════════════════════════════════\n');

    // 1. Login
    console.log('1. Logging in as admin...');
    const loginRes = await request('/auth/login', 'POST', {
        email: 'admin@sohraa.com',
        password: 'admin123',
    });
    if (!loginRes) {
        console.error('Login failed! Make sure backend is running.');
        process.exit(1);
    }

    // 2. Create a property
    console.log('\n2. Creating property...');
    const propRes = await request('/properties', 'POST', {
        name: 'Sohraa Lakeside Resort',
        address: '123 Lakefront Drive, Near Jal Mahal',
        city: 'Jaipur',
        state: 'Rajasthan',
        country: 'India',
        postalCode: '302001',
        timezone: 'Asia/Kolkata',
        status: 'ACTIVE',
    });
    const propId = propRes?.data?.id;
    if (!propId) { console.error('Failed to create property'); process.exit(1); }

    // 3. Create room types
    console.log('\n3. Creating room types...');
    const rtStandard = await request(`/properties/${propId}/room-types`, 'POST', {
        name: 'Standard Room',
        description: 'Comfortable room with essential amenities, queen bed, and garden view.',
        baseOccupancy: 2,
        maxOccupancy: 3,
    });
    const rtDeluxe = await request(`/properties/${propId}/room-types`, 'POST', {
        name: 'Deluxe Suite',
        description: 'Spacious suite with king bed, sitting area, lake view, and premium amenities.',
        baseOccupancy: 2,
        maxOccupancy: 4,
    });
    const rtVilla = await request(`/properties/${propId}/room-types`, 'POST', {
        name: 'Luxury Villa',
        description: 'Private villa with 2 bedrooms, private pool, garden, and butler service.',
        baseOccupancy: 4,
        maxOccupancy: 6,
    });

    const stdTypeId = rtStandard?.data?.id;
    const dlxTypeId = rtDeluxe?.data?.id;
    const vilTypeId = rtVilla?.data?.id;

    // 4. Create blocks
    console.log('\n4. Creating property blocks...');
    const blockA = await request(`/properties/${propId}/blocks`, 'POST', {
        name: 'Sunrise Wing',
        blockType: 'APARTMENT',
        minBookingUnit: 'ROOM',
    });
    const blockB = await request(`/properties/${propId}/blocks`, 'POST', {
        name: 'Lakeside Villas',
        blockType: 'VILLA',
        minBookingUnit: 'BLOCK',
    });
    const blockC = await request(`/properties/${propId}/blocks`, 'POST', {
        name: 'Garden Tents',
        blockType: 'TENT_CLUSTER',
        minBookingUnit: 'ROOM',
    });

    const blockAId = blockA?.data?.id;
    const blockBId = blockB?.data?.id;

    // 5. Create rooms
    console.log('\n5. Creating rooms...');
    const rooms = [];
    // Standard rooms (101-106)
    for (let i = 1; i <= 6; i++) {
        const r = await request(`/properties/${propId}/rooms`, 'POST', {
            roomNumber: `10${i}`,
            floorNumber: 1,
            roomTypeId: stdTypeId,
            blockId: blockAId,
            status: i <= 4 ? 'AVAILABLE' : (i === 5 ? 'OCCUPIED' : 'MAINTENANCE'),
        });
        if (r?.data) rooms.push(r.data);
    }
    // Deluxe rooms (201-204)
    for (let i = 1; i <= 4; i++) {
        const r = await request(`/properties/${propId}/rooms`, 'POST', {
            roomNumber: `20${i}`,
            floorNumber: 2,
            roomTypeId: dlxTypeId,
            blockId: blockAId,
            status: i <= 3 ? 'AVAILABLE' : 'OCCUPIED',
        });
        if (r?.data) rooms.push(r.data);
    }
    // Villas (V1-V3)
    for (let i = 1; i <= 3; i++) {
        const r = await request(`/properties/${propId}/rooms`, 'POST', {
            roomNumber: `V${i}`,
            floorNumber: 0,
            roomTypeId: vilTypeId,
            blockId: blockBId,
            status: 'AVAILABLE',
        });
        if (r?.data) rooms.push(r.data);
    }

    // 6. Create rate plan with rules
    console.log('\n6. Creating rate plan and rules...');
    const ratePlanRes = await request(`/properties/${propId}/rate-plans`, 'POST', {
        name: 'Standard Rate',
        currency: 'INR',
    });
    const ratePlanId = ratePlanRes?.data?.id;

    if (ratePlanId) {
        // Standard room rates
        await request(`/rate-plans/${ratePlanId}/rules`, 'POST', {
            roomTypeId: stdTypeId,
            startDate: '2025-01-01',
            endDate: '2026-12-31',
            weekdayPrice: 2500,
            weekendPrice: 3500,
            extraAdultPrice: 500,
            extraChildPrice: 300,
            minNights: 1,
            priority: 1,
            status: 'ACTIVE',
            notes: 'Base pricing for standard rooms',
        });
        // Deluxe suite rates
        await request(`/rate-plans/${ratePlanId}/rules`, 'POST', {
            roomTypeId: dlxTypeId,
            startDate: '2025-01-01',
            endDate: '2026-12-31',
            weekdayPrice: 5000,
            weekendPrice: 7000,
            extraAdultPrice: 800,
            extraChildPrice: 500,
            minNights: 1,
            priority: 1,
            status: 'ACTIVE',
            notes: 'Base pricing for deluxe suites',
        });
        // Villa rates
        await request(`/rate-plans/${ratePlanId}/rules`, 'POST', {
            roomTypeId: vilTypeId,
            startDate: '2025-01-01',
            endDate: '2026-12-31',
            weekdayPrice: 12000,
            weekendPrice: 15000,
            extraAdultPrice: 1500,
            extraChildPrice: 800,
            minNights: 2,
            priority: 1,
            status: 'ACTIVE',
            notes: 'Base pricing for luxury villas',
        });
    }

    // 7. Pricing config
    console.log('\n7. Setting pricing config...');
    await request(`/properties/${propId}/pricing-config`, 'PUT', {
        weekendDays: [false, false, false, false, false, true, true], // Sat & Sun
    });

    // 8. Create a booking
    console.log('\n8. Creating sample bookings...');
    const room101 = rooms.find(r => r.roomNumber === '101');
    const room201 = rooms.find(r => r.roomNumber === '201');

    if (room101 && stdTypeId) {
        const bookingRes = await request(`/properties/${propId}/bookings`, 'POST', {
            status: 'CONFIRMED',
            source: 'WEBSITE',
            paymentStatus: 'PARTIAL',
            totalAmount: 7500,
            advanceAmount: 3000,
            currency: 'INR',
            notes: 'Guest requested early check-in',
            items: [{
                roomTypeId: stdTypeId,
                roomId: room101.id,
                checkinDate: '2026-02-23',
                checkoutDate: '2026-02-26',
                pricePerNight: 2500,
                numAdults: 2,
                numChildren: 1,
            }],
            guests: [{
                name: 'Rahul Sharma',
                phone: '+91-9876543210',
                email: 'rahul.sharma@email.com',
                isPrimary: true,
            }, {
                name: 'Priya Sharma',
                phone: '+91-9876543211',
                isPrimary: false,
            }],
            payment: {
                amount: 3000,
                paymentMethod: 'UPI',
                transactionId: 'UPI-TXN-2026022301',
            },
        });

        // Add a second payment
        if (bookingRes?.data?.id) {
            await request(`/bookings/${bookingRes.data.id}/payments`, 'POST', {
                amount: 2000,
                paymentMethod: 'CASH',
            });
        }
    }

    if (room201 && dlxTypeId) {
        await request(`/properties/${propId}/bookings`, 'POST', {
            status: 'CONFIRMED',
            source: 'PHONE',
            paymentStatus: 'PAID',
            totalAmount: 15000,
            advanceAmount: 15000,
            currency: 'INR',
            notes: 'VIP guest - arrange welcome basket',
            items: [{
                roomTypeId: dlxTypeId,
                roomId: room201.id,
                checkinDate: '2026-02-25',
                checkoutDate: '2026-02-28',
                pricePerNight: 5000,
                numAdults: 2,
                numChildren: 0,
            }],
            guests: [{
                name: 'Arun Kapoor',
                phone: '+91-9123456789',
                email: 'arun.kapoor@business.com',
                isPrimary: true,
            }],
            payment: {
                amount: 15000,
                paymentMethod: 'CARD',
                transactionId: 'CARD-TXN-20260222-AK',
            },
        });
    }

    // 9. Create maintenance records
    console.log('\n9. Creating maintenance records...');
    const room106 = rooms.find(r => r.roomNumber === '106');
    if (room106) {
        await request(`/rooms/${room106.id}/maintenance`, 'POST', {
            startDate: '2026-02-23',
            endDate: '2026-02-25',
            reason: 'AC unit replacement and deep cleaning',
            status: 'IN_PROGRESS',
        });
        await request(`/rooms/${room106.id}/maintenance`, 'POST', {
            startDate: '2026-03-01',
            endDate: '2026-03-02',
            reason: 'Bathroom plumbing inspection',
            status: 'SCHEDULED',
        });
    }

    // 10. Create additional roles and users
    console.log('\n10. Creating roles and users...');
    const mgrRole = await request('/roles', 'POST', {
        name: 'MANAGER',
        description: 'Hotel manager with booking and room management access',
    });
    const staffRole = await request('/roles', 'POST', {
        name: 'FRONT_DESK',
        description: 'Front desk staff with booking and guest management access',
    });

    if (mgrRole?.data?.id) {
        await request('/users', 'POST', {
            name: 'Vikram Singh',
            email: 'vikram@sohraa.com',
            password: 'manager123',
            roleId: mgrRole.data.id,
        });
    }
    if (staffRole?.data?.id) {
        await request('/users', 'POST', {
            name: 'Neha Patel',
            email: 'neha@sohraa.com',
            password: 'staff123',
            roleId: staffRole.data.id,
        });
        await request('/users', 'POST', {
            name: 'Arjun Reddy',
            email: 'arjun@sohraa.com',
            password: 'staff123',
            roleId: staffRole.data.id,
        });
    }

    console.log('\n═══════════════════════════════════════');
    console.log('  ✓ Seed data created successfully!');
    console.log('═══════════════════════════════════════');
    console.log('\nLogin credentials:');
    console.log('  Admin:     admin@sohraa.com / admin123');
    console.log('  Manager:   vikram@sohraa.com / manager123');
    console.log('  Staff:     neha@sohraa.com / staff123');
    console.log('  Staff:     arjun@sohraa.com / staff123');
    console.log(`\nProperty created with ID: ${propId}`);
    console.log(`Rooms: ${rooms.map(r => r.roomNumber).join(', ')}`);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
