// ============================================
// API Response Wrapper
// ============================================
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: ErrorDetails;
}

export interface ErrorDetails {
  code: string;
  message: string;
  details?: unknown;
}

// ============================================
// Auth
// ============================================
export interface LoginRequest {
  email: string;
  password: string;
}

// ============================================
// Property
// ============================================
export type PropertyStatus = "ACTIVE" | "INACTIVE";

export interface PropertyResponse {
  id: number;
  name: string;
  timezone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  status: PropertyStatus;
}

export interface CreatePropertyRequest {
  name: string;
  timezone?: string;
  address?: string;
  city: string;
  state?: string;
  country: string;
  postalCode?: string;
  status?: PropertyStatus;
}

export interface UpdatePropertyRequest {
  name?: string;
  timezone?: string;
  address?: string;
  city?: string;
  state?: string;
  country?: string;
  postalCode?: string;
  status?: PropertyStatus;
}

// ============================================
// Property Block
// ============================================
export type BlockType = "APARTMENT" | "GLASS_HOUSE" | "TENT_CLUSTER" | "VILLA" | "OTHER";
export type MinBookingUnit = "ROOM" | "BLOCK";

export interface PropertyBlockResponse {
  id: number;
  propertyId: number;
  name: string;
  blockType: BlockType;
  minBookingUnit: MinBookingUnit;
}

export interface CreatePropertyBlockRequest {
  name: string;
  blockType: BlockType;
  minBookingUnit: MinBookingUnit;
}

export interface UpdatePropertyBlockRequest {
  name?: string;
  blockType?: BlockType;
  minBookingUnit?: MinBookingUnit;
}

// ============================================
// Room
// ============================================
export type RoomStatus = "AVAILABLE" | "OCCUPIED" | "MAINTENANCE" | "OUT_OF_SERVICE";

export interface RoomResponse {
  id: number;
  propertyId: number;
  blockId: number;
  roomTypeId: number;
  roomNumber: string;
  floorNumber: number;
  status: RoomStatus;
}

export interface CreateRoomRequest {
  roomTypeId: number;
  blockId?: number;
  roomNumber: string;
  floorNumber?: number;
  status?: RoomStatus;
}

export interface UpdateRoomRequest {
  roomTypeId?: number;
  blockId?: number;
  roomNumber?: string;
  floorNumber?: number;
  status?: RoomStatus;
}

// ============================================
// Room Type
// ============================================
export interface RoomTypeResponse {
  id: number;
  propertyId: number;
  name: string;
  description: string;
  baseOccupancy: number;
  maxOccupancy: number;
}

export interface CreateRoomTypeRequest {
  name: string;
  description?: string;
  baseOccupancy?: number;
  maxOccupancy?: number;
}

export interface UpdateRoomTypeRequest {
  name?: string;
  description?: string;
  baseOccupancy?: number;
  maxOccupancy?: number;
}

// ============================================
// Rate Plan
// ============================================
export interface RatePlanResponse {
  id: number;
  propertyId: number;
  name: string;
  currency: string;
}

export interface CreateRatePlanRequest {
  name: string;
  currency: string;
}

export interface UpdateRatePlanRequest {
  name?: string;
  currency?: string;
}

// ============================================
// Rate Rule
// ============================================
export type RateRuleStatus = "ACTIVE" | "INACTIVE";

export interface RateRuleResponse {
  id: number;
  ratePlanId: number;
  roomTypeId: number;
  startDate: string;
  endDate: string;
  weekdayPrice: number;
  weekendPrice: number;
  extraAdultPrice: number;
  extraChildPrice: number;
  minNights: number;
  priority: number;
  status: RateRuleStatus;
  notes: string;
}

export interface CreateRateRuleRequest {
  roomTypeId: number;
  startDate: string;
  endDate: string;
  weekdayPrice: number;
  weekendPrice: number;
  extraAdultPrice?: number;
  extraChildPrice?: number;
  minNights?: number;
  priority?: number;
  status?: RateRuleStatus;
  notes?: string;
}

export interface UpdateRateRuleRequest {
  startDate?: string;
  endDate?: string;
  weekdayPrice?: number;
  weekendPrice?: number;
  extraAdultPrice?: number;
  extraChildPrice?: number;
  minNights?: number;
  priority?: number;
  status?: RateRuleStatus;
  notes?: string;
}

// ============================================
// Booking
// ============================================
export type BookingStatus = "DRAFT" | "CONFIRMED" | "CHECKED_IN" | "CHECKED_OUT" | "CANCELLED" | "NO_SHOW";
export type BookingSource = "INTERNAL" | "WEBSITE" | "B2B" | "PHONE";
export type PaymentStatus = "PENDING" | "PARTIAL" | "PAID" | "REFUNDED";

export interface BookingItemResponse {
  id: number;
  bookingId: number;
  roomTypeId: number;
  roomId: number;
  checkinDate: string;
  checkoutDate: string;
  pricePerNight: number;
  discountAmount: number;
  numAdults: number;
  numChildren: number;
}

export interface BookingResponse {
  id: number;
  propertyId: number;
  createdByUserId: number;
  status: BookingStatus;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  advanceAmount: number;
  currency: string;
  checkinTime: string;
  checkoutTime: string;
  notes: string;
  items: BookingItemResponse[];
}

export interface BookingItemRequest {
  roomTypeId: number;
  roomId: number;
  checkinDate: string;
  checkoutDate: string;
  pricePerNight: number;
  discountAmount?: number;
  numAdults?: number;
  numChildren?: number;
}

export interface CreateBookingRequest {
  status: BookingStatus;
  source: BookingSource;
  paymentStatus: PaymentStatus;
  totalAmount: number;
  advanceAmount?: number;
  currency: string;
  checkinTime?: string;
  checkoutTime?: string;
  notes?: string;
  items: BookingItemRequest[];
  guests: GuestRequest[];
  payment?: CreatePaymentRequest;
}

export interface UpdateBookingRequest {
  status?: BookingStatus;
  source?: BookingSource;
  paymentStatus?: PaymentStatus;
  checkinTime?: string;
  checkoutTime?: string;
  notes?: string;
}

export interface UpdateBookingItemRequest {
  roomId?: number;
  pricePerNight?: number;
  discountAmount?: number;
  numAdults?: number;
  numChildren?: number;
}

// ============================================
// Guest
// ============================================
export interface GuestResponse {
  id: number;
  bookingId: number;
  name: string;
  phone: string;
  email: string;
  isPrimary: boolean;
}

export interface GuestRequest {
  name: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

export interface UpdateGuestRequest {
  name?: string;
  phone?: string;
  email?: string;
  isPrimary?: boolean;
}

// ============================================
// Payment
// ============================================
export type PaymentMethod = "CASH" | "UPI" | "INTERNET_BANKING" | "CARD" | "OTHER";
export type PaymentResponseStatus = "SUCCESS" | "PENDING" | "FAILED" | "REFUNDED";

export interface PaymentResponse {
  id: number;
  bookingId: number;
  amount: number;
  currency: string;
  paymentMethod: PaymentMethod;
  status: PaymentResponseStatus;
  transactionId: string;
  createdAt: string;
}

export interface CreatePaymentRequest {
  amount: number;
  paymentMethod: PaymentMethod;
  transactionId?: string;
}

// ============================================
// User
// ============================================
export interface UserResponse {
  id: number;
  name: string;
  email: string;
  roleId: number;
  roleName: string;
  isActive: boolean;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
  roleId: number;
}

export interface UpdateUserRequest {
  name?: string;
  roleId?: number;
  isActive?: boolean;
}

// ============================================
// Role
// ============================================
export interface RoleResponse {
  id: number;
  name: string;
  description: string;
}

export interface CreateRoleRequest {
  name: string;
  description?: string;
}

export interface UpdateRoleRequest {
  name?: string;
  description?: string;
}

// ============================================
// Permission
// ============================================
export type AccessLevel = "DISABLED" | "READ" | "WRITE";

export interface PermissionResponse {
  id: number;
  code: string;
  description: string;
}

export interface RolePermissionResponse {
  id: number;
  roleId: number;
  permissionId: number;
  permissionCode: string;
  accessLevel: AccessLevel;
}

export interface RolePermissionRequest {
  permissionId: number;
  accessLevel: AccessLevel;
}

// ============================================
// User Permission Override
// ============================================
export interface UserPermissionOverrideResponse {
  id: number;
  userId: number;
  permissionId: number;
  permissionCode: string;
  accessLevel: AccessLevel;
}

export interface UserPermissionOverrideRequest {
  permissionId: number;
  accessLevel: AccessLevel;
}

// ============================================
// Room Maintenance
// ============================================
export type MaintenanceStatus = "SCHEDULED" | "IN_PROGRESS" | "COMPLETED";

export interface RoomMaintenanceResponse {
  id: number;
  roomId: number;
  startDate: string;
  endDate: string;
  reason: string;
  status: MaintenanceStatus;
}

export interface CreateRoomMaintenanceRequest {
  startDate: string;
  endDate?: string;
  reason?: string;
  status?: MaintenanceStatus;
}

export interface UpdateRoomMaintenanceRequest {
  startDate?: string;
  endDate?: string;
  reason?: string;
  status?: MaintenanceStatus;
}

// ============================================
// Pricing Config
// ============================================
export interface PropertyPricingConfigResponse {
  id: number;
  propertyId: number;
  weekendDays: boolean[];
}

export interface PropertyPricingConfigRequest {
  weekendDays: boolean[];
}

// ============================================
// Availability
// ============================================
export interface AvailabilityResponse {
  propertyId: number;
  startDate: string;
  endDate: string;
  roomTypes: RoomTypeAvailability[];
}

export interface RoomTypeAvailability {
  roomTypeId: number;
  roomTypeName: string;
  rooms: RoomAvailability[];
}

export interface RoomAvailability {
  roomId: number;
  roomNumber: string;
  occupiedDates: OccupiedDate[];
}

export interface OccupiedDate {
  date: string;
  status: string;
  bookingId: number;
  bookingStatus: BookingStatus;
  reason: string;
}

export interface RoomAvailabilityCheckResponse {
  roomId: number;
  startDate: string;
  endDate: string;
  isAvailable: boolean;
  occupiedDates: string[];
}
