export interface PackingRecord {
  id: string; // Generated on client for keying
  Timestamp?: string; // Col A
  Date: string; // Col B
  Shipment: string;
  Mode: string;
  Product: string;
  "SI QTY": number;
  QTY: number;
  Remark?: string; // Col Y
  [key: string]: string | number | undefined; // For dynamic package columns
}

export const PACKAGE_COLUMNS = [
  "110x110x115 QTY",
  "110x110x90 QTY",
  "110x110x65 QTY",
  "80X120X115 QTY",
  "80X120X90 QTY",
  "80X120X65 QTY",
  "RETURNABLE QTY",
  "42X46X68 QTY",
  "47X66X68 QTY",
  "53X53X58 QTY",
  "57X64X84 QTY",
  "68X74X86 QTY",
  "70X100X90 QTY",
  "27X27X22 QTY",
  "53X53X19 QTY",
  "WARP QTY",
  "UNIT QTY"
];

export interface DashboardStats {
  totalItems: number;
  totalSI: number;
  totalPackages: number;
  topCustomer: string;
  topMode: string;
}
