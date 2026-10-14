export interface ApplicationHistoryItem {
  id: string;
  lotCode: string;
  lotCategory: string;
  propertyName: string;
  appliedByName: string;
  applicationDate: string;
  applicationTime: string | null;
  dose: number;
  unit: string;
  medicineName: string;
  medicineBatchNumber: string;
  route: string;
  meatWithdrawalEnd: string | null;
  goal: string | null;
  notes: string | null;
}
