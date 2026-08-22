const BASE_URL = "http://159.69.174.21:2038";

async function apiRequest<T = any>(
  path: string,
  body: Record<string, any>,
  label: string,
): Promise<T> {
  const url = `${BASE_URL}${path}`;

  console.log("====================================");
  console.log(`[${label}] Request URL:`, url);
  console.log(`[${label}] Request Body:`, body);
  console.log("====================================");

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(body),
    });

    console.log(`[${label}] Response Status:`, response.status);

    const responseText = await response.text();
    console.log(`[${label}] Raw Response:`, responseText);

    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = responseText;
    }

    console.log(`[${label}] Parsed Response:`, data);

    if (!response.ok) {
      throw new Error(
        data?.msg ||
          data?.message ||
          data?.Message ||
          data?.error ||
          data?.Error ||
          `${label} failed. Server returned ${response.status}`,
      );
    }

    return data;
  } catch (error: any) {
    console.log(`[${label}] Error:`, error);
    throw new Error(
      error?.message || `Unable to connect to the ${label} server.`,
    );
  }
}

// GET variant — some endpoints (like GetMobCategory) only accept GET, not POST
async function apiGetRequest<T = any>(path: string, label: string): Promise<T> {
  const url = `${BASE_URL}${path}`;

  console.log("====================================");
  console.log(`[${label}] Request URL:`, url);
  console.log(`[${label}] Method: GET`);
  console.log("====================================");

  try {
    const response = await fetch(url, {
      method: "GET",
      headers: {
        Accept: "application/json",
      },
    });

    console.log(`[${label}] Response Status:`, response.status);

    const responseText = await response.text();
    console.log(`[${label}] Raw Response:`, responseText);

    let data: any;
    try {
      data = responseText ? JSON.parse(responseText) : null;
    } catch {
      data = responseText;
    }

    console.log(`[${label}] Parsed Response:`, data);

    if (!response.ok) {
      throw new Error(
        data?.msg ||
          data?.message ||
          data?.Message ||
          data?.error ||
          data?.Error ||
          `${label} failed. Server returned ${response.status}`,
      );
    }

    return data;
  } catch (error: any) {
    console.log(`[${label}] Error:`, error);
    throw new Error(
      error?.message || `Unable to connect to the ${label} server.`,
    );
  }
}

export async function loginUser(
  email: string,
  password: string,
  regType: string = "Normal",
) {
  return apiRequest(
    "/mob/MobUserLogin",
    {
      Email: email,
      Password: password,
      RegType: regType,
    },
    "LOGIN",
  );
}

export async function signupUser(payload: {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  password: string;
}) {
  return apiRequest(
    "/mob/InsertMobUser",
    {
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Email: payload.email,
      MobileNo: payload.phone,
      Password: payload.password,
      UserType: "Customer",
      RegType: "Normal",
    },
    "SIGNUP",
  );
}

export async function signupGoogleUser(payload: {
  firstName: string;
  lastName: string;
  email: string;
  googleId: string;
}) {
  console.log("====================================");
  console.log("[API] GOOGLE SIGNUP REQUEST");
  console.log("====================================");

  console.log("[API] FirstName:", payload.firstName);
  console.log("[API] LastName:", payload.lastName);
  console.log("[API] Email:", payload.email);
  console.log("[API] Google ID:", payload.googleId);
  console.log("[API] RegType:", "Google");

  const response = await apiRequest(
    "/mob/InsertMobUser",
    {
      FirstName: payload.firstName,
      LastName: payload.lastName,
      Email: payload.email,
      MobileNo: "",
      Password: "",
      UserType: "Customer",
      RegType: "Google",
      GoogleId: payload.googleId,
    },
    "GOOGLE_SIGNUP",
  );

  console.log("====================================");
  console.log("[API] GOOGLE SIGNUP RESPONSE");
  console.log("====================================");
  console.log("[API] Response:", response);

  return response;
}

// ... (rest of the API functions remain unchanged)

export async function updateMobUser(payload: {
  mobUserID: number;
  firstName: string;
  lastName: string;
  mobileNo: string;
  email: string;
  userAddress?: string;
  pinCode?: string;
}) {
  return apiRequest(
    "/mob/UpdateMobUser",
    {
      MobUserID: payload.mobUserID,
      FirstName: payload.firstName,
      LastName: payload.lastName,
      MobileNo: payload.mobileNo,
      Email: payload.email,
      UserAddress: payload.userAddress ?? "",
      PinCode: payload.pinCode ?? "",
    },
    "UPDATE_USER",
  );
}

export async function updateMobUserImage(
  mobUserID: number,
  base64Image: string,
) {
  return apiRequest(
    "/mob/UpdateMobUserImage",
    {
      MobUserID: mobUserID,
      MobUserImage: base64Image,
    },
    "UPDATE_USER_IMAGE",
  );
}

export async function generateMobOtp(email: string) {
  return apiRequest("/mob/GenerateMobOTP", { Email: email }, "GENERATE_OTP");
}

export async function changeMobPassword(payload: {
  email: string;
  otp: string;
  password: string;
}) {
  return apiRequest(
    "/mob/ChangeMobPassword",
    {
      Email: payload.email,
      OTP: payload.otp,
      Password: payload.password,
    },
    "CHANGE_PASSWORD",
  );
}

// ---------- Categories ----------

export type CatType = "Cat" | "SubCat";

// Raw shape exactly as the API returns it
export interface MobCategoryRaw {
  categoryID: number;
  subCategoryID: number;
  categoryTitle: string;
  subCategoryTitle: string;
  catImage: string | null;
  subCatImage: string | null;
  catType: CatType;
  imagesPath: string | null;
}

// Clean, normalized shape the app actually works with
export interface MobCategory {
  id: number;
  name: string;
  type: CatType;
  parentId: number | null; // null for Cat rows, the parent categoryID for SubCat rows
  image: string | null;
}

function normalizeCategory(raw: MobCategoryRaw): MobCategory {
  const isSubCat = raw.catType === "SubCat";
  return {
    id: isSubCat ? raw.subCategoryID : raw.categoryID,
    name: isSubCat ? raw.subCategoryTitle : raw.categoryTitle,
    type: raw.catType,
    parentId: isSubCat ? raw.categoryID : null,
    image: raw.imagesPath || null,
  };
}

export async function getMobCategories() {
  const raw = await apiGetRequest<MobCategoryRaw[]>(
    "/mob/GetMobCategory",
    "GET_CATEGORIES",
  );
  return Array.isArray(raw) ? raw.map(normalizeCategory) : [];
}
// ---- Products ----

export interface MobProduct {
  productID: number;
  productTitle: string;
  productCode: string;
  gst: number;
  et: number;
  avgCostPrice: number;
  salePrice: number;
  discPercentage: number;
  discRupees: number;
  barcode: string;
  productImage: string | null;
  categoryTitle: string;
  subCategoryTitle: string;
  brandTitle: string;
  uomTitle: string;
  productTypeTitle: string;
  favStatus: boolean;
  imagesPath: string | null;
  productDescription: string;
  // stockQuantity?: number;  // <-- ADD THIS once you confirm the real field name from your API
}

export async function getMobProducts(
  catId: number,
  subCatId: number,
): Promise<MobProduct[]> {
  const data = await apiGetRequest<MobProduct[]>(
    `/mob/GetMobProducts?CatID=${catId}&SubCatID=${subCatId}`,
    "GET_PRODUCTS",
  );
  return Array.isArray(data) ? data : [];
}

// ---- Wishlist ----

export async function addRemoveFromWishlist(payload: {
  productID: number;
  mobUserID: number;
  favStatus: boolean;
}) {
  return apiRequest(
    "/mob/AddRemoveFromWishList",
    {
      ProductID: payload.productID,
      MobUserID: payload.mobUserID,
      FavStatus: payload.favStatus,
    },
    "TOGGLE_WISHLIST",
  );
}

export async function getMobWishlistProducts(
  userID: number,
): Promise<MobProduct[]> {
  const data = await apiGetRequest<MobProduct[]>(
    `/mob/GetMobWishListProducts?UserID=${userID}`,
    "GET_WISHLIST",
  );
  return Array.isArray(data) ? data : [];
}
// ---- Orders ----

export interface OrderDetailItem {
  ProductID: number;
  ProductTitle: string;
  Quantity: number;
  CostPrice: number;
  AvgCostPrice: number;
  SalePrice: number;
  DiscInR: number;
  DiscInP: number;
  Gst: number;
  ET: number;
}

export interface InsertOrderPayload {
  mobUserID: number;
  paymentMethod: string;
  paymentReceiptDoc?: string;
  orderTotal: number;
  orderDiscount: number;
  netTotal: number;
  deliveryType: string;
  deliveryAddress: string;
  deliveryInstruction?: string;
  deliveryContact: string;
  latitude?: string;
  longitude?: string;
  orderDetail: OrderDetailItem[];
}

export async function insertOrder(payload: InsertOrderPayload) {
  return apiRequest(
    "/mob/InsertOrder",
    {
      MobUserID: payload.mobUserID,
      PaymentMethod: payload.paymentMethod,
      PaymentReceiptDoc: payload.paymentReceiptDoc ?? "-",
      OrderTotal: payload.orderTotal,
      OrderDiscount: payload.orderDiscount,
      NetTotal: payload.netTotal,
      DeliveryType: payload.deliveryType,
      DeliveryAddress: payload.deliveryAddress,
      DeliveryInstruction: payload.deliveryInstruction ?? "-",
      DeliveryContact: payload.deliveryContact,
      Latitude: payload.latitude ?? "0",
      Longitude: payload.longitude ?? "0",
      OrderDetail: JSON.stringify(payload.orderDetail),
    },
    "INSERT_ORDER",
  );
}

// ---- Bank Details (for IBFT payment) ----

export interface MobBankDetail {
  accountTitle: string;
  accountNo: string;
  iban: string;
  bankName: string;
}

export async function getBankDetail(): Promise<MobBankDetail | null> {
  const data = await apiGetRequest<any>(
    "/mob/GetBankDetail",
    "GET_BANK_DETAIL",
  );
  const raw = Array.isArray(data) ? data[0] : data;
  if (!raw) return null;

  // NOTE: field names guessed from the API's existing camelCase convention
  // (see MobCategoryRaw/MobProduct). Console-log the raw response once and
  // adjust the keys below if they don't match.
  return {
    accountTitle: raw.accountTitle ?? raw.AccountTitle ?? "",
    accountNo: raw.accountNo ?? raw.accountNo ?? "",
    iban: raw.iban ?? raw.IBAN ?? raw.Iban ?? "",
    bankName: raw.bankName ?? raw.BankName ?? "",
  };
}
// ---- Order History ----

// This is the ACTUAL raw shape returned by /mob/GetMobOrders, confirmed
// from a live response. Note there is NO `orderID` — the row identifier is
// `orderNo`. `orderDetail` also comes back `null` on this endpoint (unlike
// InsertOrder, which sends OrderDetail as a stringified array) — line-item
// breakdown isn't available from GetMobOrders, only order-level summary data.
export interface MobOrder {
  orderNo: number; // use this as the unique key — there is no orderID
  orderDate: string;
  mobUserID: number;
  paymentMethod: string;
  paymentReceiptDoc: string | null; // full image URL when present (IBFT), null for COD
  orderTotal: number;
  orderDiscount: number;
  netTotal: number;
  deliveryType: string;
  deliveryAddress: string;
  deliveryInstruction: string; // free text — for IBFT orders this also embeds "Bank: ... | Account Title: ... | Account No: ... | IBAN: ..."
  deliveryContact: string;
  orderStatus: string; // confirmed values so far: "Pending" | "Processing" — more likely exist (e.g. "Delivered"/"Cancelled"), treat unknowns gracefully
  deliveredOn: string | null; // "0001-01-01T00:00:00" sentinel means "not delivered yet" — normalized to null
  remarks: string;
  totalItems: number;
  customerName: string;
  riderName: string | null;
  riderMobileNo: string | null;
  mobileNo: string;
  pinCode: string | null;
}

export type OrderReqFilter = "All" | "Recent" | "Past";

function normalizeMobOrder(raw: any): MobOrder {
  const deliveredOnRaw = raw.deliveredOn ?? raw.DeliveredOn ?? null;
  const deliveredOn =
    deliveredOnRaw && !deliveredOnRaw.startsWith("0001-01-01")
      ? deliveredOnRaw
      : null;

  return {
    orderNo: raw.orderNo ?? raw.OrderNo,
    orderDate: raw.orderDate ?? raw.OrderDate ?? "",
    mobUserID: raw.mobUserID ?? raw.MobUserID,
    paymentMethod: raw.paymentMethod ?? raw.PaymentMethod ?? "",
    paymentReceiptDoc: raw.paymentReceiptDoc ?? raw.PaymentReceiptDoc ?? null,
    orderTotal: raw.orderTotal ?? raw.OrderTotal ?? 0,
    orderDiscount: raw.orderDiscount ?? raw.OrderDiscount ?? 0,
    netTotal: raw.netTotal ?? raw.NetTotal ?? 0,
    deliveryType: raw.deliveryType ?? raw.DeliveryType ?? "",
    deliveryAddress: raw.deliveryAddress ?? raw.DeliveryAddress ?? "",
    deliveryInstruction:
      raw.deliveryInstruction ?? raw.DeliveryInstruction ?? "-",
    deliveryContact: raw.deliveryContact ?? raw.DeliveryContact ?? "",
    orderStatus: raw.orderStatus ?? raw.OrderStatus ?? "Pending",
    deliveredOn,
    remarks: raw.remarks ?? raw.Remarks ?? "-",
    totalItems: raw.totalItems ?? raw.TotalItems ?? 0,
    customerName: raw.customerName ?? raw.CustomerName ?? "",
    riderName: raw.riderName ?? raw.RiderName ?? null,
    riderMobileNo: raw.riderMobileNo ?? raw.RiderMobileNo ?? null,
    mobileNo: raw.mobileNo ?? raw.MobileNo ?? "",
    pinCode: raw.pinCode ?? raw.PinCode ?? null,
  };
}

export async function getMobOrders(
  mobUserID: number,
  fromDate: string | null,
  toDate: string | null,
  reqFilter: OrderReqFilter = "All",
): Promise<MobOrder[]> {
  const params = new URLSearchParams();
  params.set("MobUserID", String(mobUserID));

  // Confirmed from a live call: reqFilter="All" sends the literal string
  // "null" for both dates. When real dates are passed in (for a genuine
  // Recent/Past date-range split, see the Orders screen), they go through
  // as-is instead of being forced to "null".
  params.set("FromDate", fromDate ?? "null");
  params.set("ToDate", toDate ?? "null");
  params.set("reqFilter", reqFilter);

  const data = await apiGetRequest<any[]>(
    `/mob/GetMobOrders?${params.toString()}`,
    "GET_ORDERS",
  );

  if (!Array.isArray(data)) return [];
  return data.map(normalizeMobOrder);
}

// ---- Rider Totals (Dashboard) ----

export interface RiderTotals {
  totalQty: number;
  totalAmount: number;
  pendingQty: number;
  pendingAmount: number;
  deliveredQty: number;
  deliveredAmount: number;
  codQty: number;
  codAmount: number;
  ibftQty: number;
  ibftAmount: number;
  cancelledQty: number;
  cancelledAmount: number;
}

function normalizeRiderTotals(raw: any): RiderTotals {
  return {
    totalQty: raw.totalQty ?? raw.TotalQty ?? 0,
    totalAmount: raw.totalAmount ?? raw.TotalAmount ?? 0,
    pendingQty: raw.pendingQty ?? raw.PendingQty ?? 0,
    pendingAmount: raw.pendingAmount ?? raw.PendingAmount ?? 0,
    deliveredQty: raw.deliveredQty ?? raw.DeliveredQty ?? 0,
    deliveredAmount: raw.deliveredAmount ?? raw.DeliveredAmount ?? 0,
    codQty: raw.codQty ?? raw.CodQty ?? 0,
    codAmount: raw.codAmount ?? raw.CodAmount ?? 0,
    ibftQty: raw.ibftQty ?? raw.IbftQty ?? 0,
    ibftAmount: raw.ibftAmount ?? raw.IbftAmount ?? 0,
    cancelledQty: raw.cancelledQty ?? raw.CancelledQty ?? 0,
    cancelledAmount: raw.cancelledAmount ?? raw.CancelledAmount ?? 0,
  };
}

export async function getRiderTotals(
  riderID: number,
  fromDate: string,
  toDate: string,
  reqFilter: OrderReqFilter = "All",
): Promise<RiderTotals | null> {
  const params = new URLSearchParams();
  params.set("RiderID", String(riderID));
  params.set("FromDate", fromDate);
  params.set("ToDate", toDate);
  params.set("reqFilter", reqFilter);

  const data = await apiGetRequest<any[]>(
    `/mob/GetRiderTotals?${params.toString()}`,
    "GET_RIDER_TOTALS",
  );

  const raw = Array.isArray(data) ? data[0] : data;
  return raw ? normalizeRiderTotals(raw) : null;
}

// ---- Rider Orders ----

export interface RiderOrder {
  orderNo: number;
  orderDate: string;
  riderID: number;
  paymentMethod: string;
  paymentReceiptDoc: string | null;
  orderTotal: number;
  orderDiscount: number;
  netTotal: number;
  deliveryType: string;
  deliveryAddress: string;
  deliveryInstruction: string;
  deliveryContact: string;
  latitude: string;
  longitude: string;
  orderStatus: string;
  deliveredOn: string | null; // "0001-01-01..." sentinel normalized to null, same as GetMobOrders
  remarks: string;
  totalItems: number;
  customerName: string;
  mobileNo: string;
  pinCode: string | null;
}

function normalizeRiderOrder(raw: any): RiderOrder {
  const deliveredOnRaw = raw.deliveredOn ?? raw.DeliveredOn ?? null;
  const deliveredOn =
    deliveredOnRaw && !String(deliveredOnRaw).startsWith("0001-01-01")
      ? deliveredOnRaw
      : null;

  return {
    orderNo: raw.orderNo ?? raw.OrderNo,
    orderDate: raw.orderDate ?? raw.OrderDate ?? "",
    riderID: raw.riderID ?? raw.RiderID,
    paymentMethod: raw.paymentMethod ?? raw.PaymentMethod ?? "",
    paymentReceiptDoc: raw.paymentReceiptDoc ?? raw.PaymentReceiptDoc ?? null,
    orderTotal: raw.orderTotal ?? raw.OrderTotal ?? 0,
    orderDiscount: raw.orderDiscount ?? raw.OrderDiscount ?? 0,
    netTotal: raw.netTotal ?? raw.NetTotal ?? 0,
    deliveryType: raw.deliveryType ?? raw.DeliveryType ?? "",
    deliveryAddress: raw.deliveryAddress ?? raw.DeliveryAddress ?? "",
    deliveryInstruction:
      raw.deliveryInstruction ?? raw.DeliveryInstruction ?? "-",
    deliveryContact: raw.deliveryContact ?? raw.DeliveryContact ?? "",
    latitude: raw.latitude ?? raw.Latitude ?? "0",
    longitude: raw.longitude ?? raw.Longitude ?? "0",
    orderStatus: raw.orderStatus ?? raw.OrderStatus ?? "Pending",
    deliveredOn,
    remarks: raw.remarks ?? raw.Remarks ?? "-",
    totalItems: raw.totalItems ?? raw.TotalItems ?? 0,
    customerName: raw.customerName ?? raw.CustomerName ?? "",
    mobileNo: raw.mobileNo ?? raw.MobileNo ?? "",
    pinCode: raw.pinCode ?? raw.PinCode ?? null,
  };
}

export async function getRiderMobOrders(
  riderID: number,
  fromDate: string,
  toDate: string,
  reqFilter: string = "All",
): Promise<RiderOrder[]> {
  const params = new URLSearchParams();
  params.set("RiderID", String(riderID));
  params.set("FromDate", fromDate);
  params.set("ToDate", toDate);
  params.set("reqFilter", reqFilter);

  const data = await apiGetRequest<any[]>(
    `/mob/GetRiderMobOrders?${params.toString()}`,
    "GET_RIDER_ORDERS",
  );

  return Array.isArray(data) ? data.map(normalizeRiderOrder) : [];
}

// ---- Single Order Detail (line items, read-only) ----

export interface OrderDetailLineItem {
  orderNo: number;
  productID: number;
  productTitle: string;
  quantity: number;
  costPrice: number;
  avgCostPrice: number;
  salePrice: number;
  discInR: number;
  discInP: number;
  gst: number;
  et: number;
}

function normalizeOrderDetailLineItem(raw: any): OrderDetailLineItem {
  return {
    orderNo: raw.orderNo ?? raw.OrderNo,
    productID: raw.productID ?? raw.ProductID,
    productTitle: raw.productTitle ?? raw.ProductTitle ?? "",
    quantity: raw.quantity ?? raw.Quantity ?? 0,
    costPrice: raw.costPrice ?? raw.CostPrice ?? 0,
    avgCostPrice: raw.avgCostPrice ?? raw.AvgCostPrice ?? 0,
    salePrice: raw.salePrice ?? raw.SalePrice ?? 0,
    discInR: raw.discInR ?? raw.DiscInR ?? 0,
    discInP: raw.discInP ?? raw.DiscInP ?? 0,
    gst: raw.gst ?? raw.Gst ?? 0,
    et: raw.et ?? raw.ET ?? 0,
  };
}

export async function getSingleOrderDetail(
  orderNo: number,
): Promise<OrderDetailLineItem[]> {
  const data = await apiGetRequest<any[]>(
    `/mob/GetSingleOrderDetail?OrderNo=${orderNo}`,
    "GET_SINGLE_ORDER_DETAIL",
  );
  return Array.isArray(data) ? data.map(normalizeOrderDetailLineItem) : [];
}

// ---- Change Order Status (rider marks Delivered, etc.) ----

export interface ChangeOrderStatusPayload {
  orderNo: number;
  riderID: number;
  orderStatus: string;
  remarks?: string;
  userID: number;
}

export async function changeOrderStatus(payload: ChangeOrderStatusPayload) {
  return apiRequest(
    "/mob/ChangeOrderStatus",
    {
      OrderNo: payload.orderNo,
      RiderID: payload.riderID,
      OrderStatus: payload.orderStatus,
      Remarks: payload.remarks || "-",
      UserID: payload.userID,
    },
    "CHANGE_ORDER_STATUS",
  );
}
