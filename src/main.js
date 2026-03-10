// ===== MAIN ENTRY POINT =====
import './style.css';
import { Router, store } from './utils.js';
import { renderLogin } from './pages/login.js';
import { renderDashboard } from './pages/dashboard.js';
import { renderProperties } from './pages/properties.js';
import { renderRooms } from './pages/rooms.js';
import { renderRoomTypes } from './pages/roomTypes.js';
import { renderBlocks } from './pages/blocks.js';
import { renderBookings } from './pages/bookings.js';
import { renderAvailability } from './pages/availability.js';
import { renderRatePlans } from './pages/ratePlans.js';
import { renderMaintenance } from './pages/maintenance.js';
import { renderPricingConfig } from './pages/pricingConfig.js';
import { renderUsers } from './pages/users.js';
import { renderRoles } from './pages/roles.js';
import { renderRoomLayout } from './pages/roomLayout.js';
import { renderWebCheckin } from './pages/webCheckin.js';
import { renderGuests } from './pages/guests.js';

// Auth guard
function requireAuth(handler) {
    return (params) => {
        const user = store.getState().user;
        if (!user) {
            window.location.hash = '#/login';
            return;
        }
        handler(params);
    };
}

// Initialize router
const router = new Router([
    { path: '/login', handler: () => renderLogin() },
    { path: '/checkin', handler: () => renderWebCheckin() }, // Public — no auth guard
    { path: '/', handler: requireAuth(() => renderDashboard()) },
    { path: '/properties', handler: requireAuth(() => renderProperties()) },
    { path: '/rooms', handler: requireAuth(() => renderRooms()) },
    { path: '/room-types', handler: requireAuth(() => renderRoomTypes()) },
    { path: '/blocks', handler: requireAuth(() => renderBlocks()) },
    { path: '/bookings', handler: requireAuth(() => renderBookings()) },
    { path: '/availability', handler: requireAuth(() => renderAvailability()) },
    { path: '/rate-plans', handler: requireAuth(() => renderRatePlans()) },
    { path: '/maintenance', handler: requireAuth(() => renderMaintenance()) },
    { path: '/pricing-config', handler: requireAuth(() => renderPricingConfig()) },
    { path: '/room-layout', handler: requireAuth(() => renderRoomLayout()) },
    { path: '/users', handler: requireAuth(() => renderUsers()) },
    { path: '/roles', handler: requireAuth(() => renderRoles()) },
    { path: '/guests', handler: requireAuth(() => renderGuests()) },
]);

// Initial route resolution
router.resolve();
