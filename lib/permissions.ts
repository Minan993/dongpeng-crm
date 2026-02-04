import { Role, Customer } from "@prisma/client";
import { AuthUser } from "@/lib/auth";

export function canViewCustomer(user: AuthUser, customer: Customer) {
  if (user.role === Role.SALES) {
    return customer.ownerUserId === user.id;
  }
  return true;
}

export function canEditCustomer(user: AuthUser, customer: Customer) {
  if (user.role === Role.SALES) {
    return customer.ownerUserId === user.id;
  }
  return true;
}

export function canTransferCustomer(user: AuthUser) {
  return user.role === Role.MANAGER || user.role === Role.OWNER;
}

export function canViewAllCustomers(user: AuthUser) {
  return user.role === Role.MANAGER || user.role === Role.OWNER;
}
