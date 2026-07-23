/**
 * SWR hooks for Banex Marketplace
 *
 * Centralizes all data-fetching with automatic deduplication, caching
 * and background revalidation. All hooks share the same SWR cache, so
 * multiple components requesting the same endpoint in one render cycle
 * only trigger a single HTTP request.
 *
 * Key patterns:
 *  - Public / unauthenticated data: key = string (endpoint path)
 *  - Token-gated data: key = [path, token] tuple so SWR auto-invalidates
 *    when the user logs in/out and never leaks data across sessions.
 *  - Mutations: call `mutate(key)` or use the bound mutate returned by useSWR
 */

import useSWR, { mutate as globalMutate } from "swr"
import {
  fetchGenericCategories,
  fetchGenericProducts,
  type GenericCategory,
  type GenericProduct,
  type Pagination,
} from "@/lib/generic-api"
import {
  sellerFetchApplication,
  sellerFetchProducts,
  sellerFetchOrders,
  sellerFetchWallet,
  sellerFetchTransactions,
  sellerFetchEarningsSummary,
  sellerFetchEarningsLines,
  sellerFetchWithdrawals,
  type SellerProfile,
  type SellerProduct,
  type SellerOrder,
  type SellerWallet,
  type SellerTransaction,
  type SellerEarningsSummary,
  type SellerEarningsLine,
  type SellerWithdrawal,
} from "@/lib/seller-api"
import {
  userFetchWallet,
  userFetchBankAccounts,
  userFetchWithdrawals,
  userFetchOrders,
  userFetchOrder,
  userFetchCart,
  userFetchAddresses,
  userFetchWishlist,
  userFetchPaymentMethods,
  type BankAccountData,
  type WithdrawalData,
} from "@/lib/user-api"
import {
  fetchDashboardData,
  fetchAdminOrders,
  fetchAdminOrder,
  fetchAdminUsers,
  fetchAdminSellers,
  fetchAdminProducts,
  fetchAdminCategories,
  fetchAdminWithdrawals,
  fetchAdminPayments,
  fetchAdminRevenueSummary,
  fetchAdminPayouts,
  fetchAdminSellerTiers,
  fetchAdminWhatsAppContacts,
  fetchAdminPaymentMethods,
  type DashboardData,
  type AdminOrder,
  type AdminUser,
  type AdminSeller,
  type AdminProduct,
  type AdminCategory,
  type AdminWithdrawal,
  type AdminPayment,
  type AdminRevenueSummary,
  type AdminRevenueLine,
  type AdminPayout,
  type AdminSellerTier,
  type AdminWhatsAppContact,
  type AdminPaymentMethod,
} from "@/lib/admin-api"

// ─── SWR Key constants ─────────────────────────────────────────────────────────
// Using string keys for public endpoints and tuple keys for token-gated ones.

export const SWR_KEYS = {
  categories: "/generic/categories",
  products: (q?: string) => q ? `/generic/products?q=${q}` : "/generic/products",
  sellerApplication: (token: string) => ["/seller/application", token] as const,
  sellerProducts: (token: string) => ["/seller/products", token] as const,
  sellerOrders: (token: string, page: number) => ["/seller/orders", token, page] as const,
  wallet: (token: string) => ["/user/wallet", token] as const,
  bankAccounts: (token: string) => ["/user/bank-accounts", token] as const,
  withdrawals: (token: string, page: number) => ["/user/withdrawals", token, page] as const,
  userOrders: (token: string, page: number) => ["/user/orders", token, page] as const,
  userOrder: (id: string, token: string) => ["/user/order", id, token] as const,
  cart: "/user/cart",
  addresses: (token: string) => ["/user/addresses", token] as const,
  wishlist: "/user/wishlist",
  paymentMethods: "/user/payment-methods",
  adminDashboard: (token: string) => ["/admin/dashboard", token] as const,
  adminOrders: (token: string) => ["/admin/orders", token] as const,
  adminOrder: (id: string, token: string) => ["/admin/order", id, token] as const,
  adminUsers: (token: string, type = "all") => ["/admin/users", type, token] as const,
  adminSellers: (token: string) => ["/admin/sellers", token] as const,
  adminCustomers: (token: string) => ["/admin/customers", token] as const,
  adminProducts: (token: string) => ["/admin/products", token] as const,
  adminCategories: (token: string) => ["/admin/categories", token] as const,
  adminWithdrawals: (token: string) => ["/admin/withdrawals", token] as const,
  adminPayments: (token: string) => ["/admin/payments", token] as const,
  adminRevenue: (token: string) => ["/admin/revenue", token] as const,
  adminPayouts: (token: string) => ["/admin/payouts", token] as const,
  adminSellerTiers: (token: string) => ["/admin/seller-tiers", token] as const,
  adminContacts: (token: string) => ["/admin/contacts", token] as const,
  sellerTransactions: (token: string, page: number) => ["/seller/finance/transactions", token, page] as const,
  sellerEarnings: (token: string) => ["/seller/finance/earnings", token] as const,
  sellerEarningsLines: (token: string, page: number) => ["/seller/finance/earnings/lines", token, page] as const,
  sellerWallet: (token: string) => ["/seller/finance/wallet", token] as const,
  sellerWithdrawals: (token: string, page: number) => ["/seller/finance/withdrawals", token, page] as const,
  adminPaymentMethods: (token: string) => ["/admin/payment-methods", token] as const,
} as const

// ─── Global mutate helpers ─────────────────────────────────────────────────────

export function invalidateSellerData(token: string) {
  globalMutate(SWR_KEYS.sellerApplication(token))
  globalMutate(SWR_KEYS.sellerProducts(token))
}

export function invalidateUserWallet(token: string) {
  globalMutate(SWR_KEYS.wallet(token))
}

// ─── Public / Generic hooks ───────────────────────────────────────────────────

export function useCategories() {
  const { data, error, isLoading } = useSWR(
    SWR_KEYS.categories,
    () => fetchGenericCategories(),
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 } // cache 5 min
  )
  return {
    categories: data?.categories ?? [] as GenericCategory[],
    totalListingsCount: data?.total_listings_count ?? 0,
    loading: isLoading,
    error,
  }
}

// ─── Seller / Vendor hooks ────────────────────────────────────────────────────

export function useSellerApplication(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.sellerApplication(token) : null,
    ([, t]) => sellerFetchApplication(t),
    { revalidateOnFocus: false, dedupingInterval: 60 * 1000 } // dedupe within 1 min
  )
  return {
    profile: data as SellerProfile | null | undefined,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerProducts(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.sellerProducts(token) : null,
    ([, t]) => sellerFetchProducts(t),
    { revalidateOnFocus: false }
  )
  return {
    products: data as SellerProduct[] | undefined,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerOrders(token: string | undefined, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.sellerOrders(token, page) : null,
    ([, t]) => sellerFetchOrders(t, page),
    { revalidateOnFocus: false }
  )
  return {
    orders: data?.orders ?? [] as SellerOrder[],
    pagination: data?.pagination ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerWallet(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<SellerWallet | null>(
    token ? SWR_KEYS.sellerWallet(token) : null,
    ([, t]) => sellerFetchWallet(t as string),
    { revalidateOnFocus: false }
  )
  return {
    wallet: data ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerTransactions(token: string | undefined, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.sellerTransactions(token, page) : null,
    ([, t]) => sellerFetchTransactions(t as string, page),
    { revalidateOnFocus: false }
  )
  return {
    transactions: ((data as any)?.transactions ?? []) as SellerTransaction[],
    pagination: (data as any)?.pagination ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerEarnings(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<SellerEarningsSummary | null>(
    token ? SWR_KEYS.sellerEarnings(token) : null,
    ([, t]) => sellerFetchEarningsSummary(t as string),
    { revalidateOnFocus: false }
  )
  return {
    earnings: data ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerEarningsLines(token: string | undefined, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.sellerEarningsLines(token, page) : null,
    ([, t]) => sellerFetchEarningsLines(t as string, page),
    { revalidateOnFocus: false }
  )
  return {
    lines: ((data as any)?.lines ?? []) as SellerEarningsLine[],
    pagination: (data as any)?.pagination ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useSellerWithdrawals(token: string | undefined, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.sellerWithdrawals(token, page) : null,
    ([, t]) => sellerFetchWithdrawals(t as string, page),
    { revalidateOnFocus: false }
  )
  return {
    withdrawals: ((data as any)?.withdrawals ?? []) as SellerWithdrawal[],
    pagination: (data as any)?.pagination ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

// ─── User / Customer hooks ────────────────────────────────────────────────────

export function useWallet(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.wallet(token) : null,
    () => userFetchWallet(),
    { revalidateOnFocus: false }
  )
  return {
    wallet: data?.wallet ?? null,
    transactions: data?.transactions ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useBankAccounts(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.bankAccounts(token) : null,
    () => userFetchBankAccounts(),
    { revalidateOnFocus: false }
  )
  return {
    bankAccounts: (data ?? []) as BankAccountData[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useUserWithdrawals(token: string | undefined, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.withdrawals(token, page) : null,
    () => userFetchWithdrawals(page),
    { revalidateOnFocus: false }
  )
  return {
    withdrawals: ((data as any)?.withdrawals ?? []) as WithdrawalData[],
    pagination: (data as any)?.pagination ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useUserOrders(token: string | undefined, page = 1) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.userOrders(token, page) : null,
    () => userFetchOrders(page),
    { revalidateOnFocus: false }
  )
  return {
    orders: (data as any)?.orders ?? [],
    pagination: (data as any)?.pagination ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useUserOrder(id: string | undefined, token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    id && token ? SWR_KEYS.userOrder(id, token) : null,
    ([, orderId]) => userFetchOrder(id!),
    { revalidateOnFocus: false }
  )
  return {
    order: (data as any)?.order ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

// ─── Admin hooks ──────────────────────────────────────────────────────────────

export function useAdminDashboard(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR<DashboardData>(
    token ? SWR_KEYS.adminDashboard(token) : null,
    ([, t]) => fetchDashboardData(t as string),
    { revalidateOnFocus: false }
  )
  return {
    data: data ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminOrders(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminOrders(token) : null,
    ([, t]) => fetchAdminOrders(t),
    { revalidateOnFocus: false }
  )
  return {
    orders: ((data as any)?.data?.orders ?? []) as AdminOrder[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminUsers(token: string | undefined, opts?: { has_seller?: 0 | 1; search?: string }) {
  const cacheKey = opts?.has_seller !== undefined ? `has_seller=${opts.has_seller}` : "all"
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminUsers(token, cacheKey) : null,
    ([, , t]) => fetchAdminUsers(t, opts),
    { revalidateOnFocus: false }
  )
  return {
    users: ((data as any)?.data?.users ?? []) as AdminUser[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminSellers(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminSellers(token) : null,
    ([, t]) => fetchAdminSellers(t),
    { revalidateOnFocus: false }
  )
  return {
    sellers: ((data as any)?.data?.sellers ?? []) as AdminSeller[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminProducts(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminProducts(token) : null,
    ([, t]) => fetchAdminProducts(t),
    { revalidateOnFocus: false }
  )
  return {
    products: ((data as any)?.data?.products ?? []) as AdminProduct[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminCategories(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminCategories(token) : null,
    ([, t]) => fetchAdminCategories(t),
    { revalidateOnFocus: false }
  )
  return {
    categories: ((data as any)?.data?.categories ?? []) as AdminCategory[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useCart() {
  const { data, error, isLoading, mutate } = useSWR(
    SWR_KEYS.cart,
    () => userFetchCart(),
    { revalidateOnFocus: false, dedupingInterval: 10 * 1000 }
  )
  return {
    cart: data ?? null,
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAddresses(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.addresses(token) : null,
    () => userFetchAddresses(),
    { revalidateOnFocus: false }
  )
  return {
    addresses: (data as any) ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useWishlist() {
  const { data, error, isLoading, mutate } = useSWR(
    SWR_KEYS.wishlist,
    () => userFetchWishlist(),
    { revalidateOnFocus: false }
  )
  return {
    wishlist: (data as any)?.wishlist ?? [],
    loading: isLoading,
    error,
    mutate,
  }
}

export function usePaymentMethods() {
  const { data, error, isLoading } = useSWR(
    SWR_KEYS.paymentMethods,
    () => userFetchPaymentMethods(),
    { revalidateOnFocus: false, dedupingInterval: 5 * 60 * 1000 }
  )
  return {
    paymentMethods: (data as any) ?? [],
    loading: isLoading,
    error,
  }
}

// (Admin hooks previously duplicated here were removed)

export function useAdminWithdrawals(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminWithdrawals(token) : null,
    ([, t]) => fetchAdminWithdrawals(t),
    { revalidateOnFocus: false }
  )
  return {
    withdrawals: ((data as any)?.data?.withdrawals ?? []) as AdminWithdrawal[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminPayments(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminPayments(token) : null,
    ([, t]) => fetchAdminPayments(t),
    { revalidateOnFocus: false }
  )
  return {
    payments: ((data as any)?.data?.payments ?? []) as AdminPayment[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminRevenue(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminRevenue(token) : null,
    ([, t]) => fetchAdminRevenueSummary(t),
    { revalidateOnFocus: false }
  )
  return {
    summary: (data?.data?.platform_revenue ?? null) as AdminRevenueSummary | null,
    lines: ((data as any)?.data?.lines ?? []) as AdminRevenueLine[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminPayouts(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminPayouts(token) : null,
    ([, t]) => fetchAdminPayouts(t),
    { revalidateOnFocus: false }
  )
  return {
    payouts: ((data as any)?.data?.payouts ?? []) as AdminPayout[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminSellerTiers(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminSellerTiers(token) : null,
    ([, t]) => fetchAdminSellerTiers(t),
    { revalidateOnFocus: false }
  )
  return {
    tiers: ((data as any)?.data?.tiers ?? []) as AdminSellerTier[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminContacts(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminContacts(token) : null,
    ([, t]) => fetchAdminWhatsAppContacts(t),
    { revalidateOnFocus: false }
  )
  return {
    contacts: ((data as any)?.data?.whatsapp_contacts ?? []) as AdminWhatsAppContact[],
    loading: isLoading,
    error,
    mutate,
  }
}

export function useAdminPaymentMethods(token: string | undefined) {
  const { data, error, isLoading, mutate } = useSWR(
    token ? SWR_KEYS.adminPaymentMethods(token) : null,
    ([, t]) => fetchAdminPaymentMethods(t),
    { revalidateOnFocus: false }
  )
  return {
    paymentMethods: ((data as any)?.data?.payment_methods ?? []) as AdminPaymentMethod[],
    loading: isLoading,
    error,
    mutate,
  }
}
