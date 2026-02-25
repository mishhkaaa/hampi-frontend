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
    { path: '/users', handler: requireAuth(() => renderUsers()) },
    { path: '/roles', handler: requireAuth(() => renderRoles()) },
]);

// Initial route resolution
router.resolve();
