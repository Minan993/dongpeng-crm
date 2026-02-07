import { z } from 'zod';

export const leadSchema = z.object({
  basic: z.object({
    customerName: z.string().min(1),
    phone: z.string().regex(/^1\d{10}$/),
    wechat: z.string().optional().or(z.literal('')),
    region: z.string().min(1),
    source: z.string().min(1),
    store: z.string().optional(),
    sales: z.string().optional(),
    remark: z.string().optional()
  }),
  house: z.object({
    community: z.string().min(1),
    address: z.string().optional(),
    houseType: z.string().min(1),
    layout: z.string().optional(),
    buildingArea: z.number().min(10).max(2000),
    innerArea: z.number().optional(),
    elevator: z.boolean().optional(),
    floor: z.number().optional(),
    measured: z.boolean().optional(),
    hasDesign: z.boolean().optional()
  }),
  needs: z.object({
    renovationType: z.string().min(1),
    companyName: z.string().optional(),
    designerContact: z.string().optional(),
    styles: z.array(z.string()).default([]),
    spaces: z.array(z.string()).default([]),
    floorHeating: z.boolean().optional(),
    antiSlip: z.boolean().optional(),
    specialNeeds: z.string().optional()
  }),
  tilePlan: z.object({
    startDate: z.string().optional(),
    expectedTileDate: z.string().min(1),
    urgent: z.boolean().optional(),
    sizePrefs: z.array(z.string()).default([]),
    colorPref: z.string().optional(),
    quantities: z.array(z.object({
      space: z.string().min(1),
      size: z.string().optional(),
      area: z.number().optional(),
      note: z.string().optional()
    })).default([]),
    materials: z.array(z.string()).default([]),
    needMeasureService: z.boolean().optional(),
    needDelivery: z.boolean().optional()
  }),
  budget: z.object({
    budgetRange: z.string().min(1),
    expectedUnitPrice: z.number().optional(),
    concerns: z.array(z.string()).default([]),
    comparedBrands: z.array(z.string()).default([]),
    visitDate: z.string().optional(),
    contactTime: z.string().optional(),
    other: z.string().optional()
  }),
  confirmed: z.boolean().refine((v) => v === true)
});
