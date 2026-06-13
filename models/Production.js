/**
 * Production Model
 * Tracks milk processing and production batches with cost analysis
 */

import mongoose from "mongoose";

const productionSchema = new mongoose.Schema(
  {
    process: {
      type: String,
      // REMOVED enum — allows custom process types added from frontend
      required: [true, "Process type is required"],
      trim: true,
    },

    // ── INPUT ──────────────────────────────────────────────
    inputQuantity: {
      type: Number,
      required: [true, "Input quantity is required"],
      min: [0, "Input quantity cannot be negative"],
    },

    inputUnit: {
      type: String,
      enum: ["L", "kg", "KG", "Liters"], // ADDED "Liters" — frontend sends this
      required: [true, "Input unit is required"],
      default: "L",
    },

    inputPrice: {
      type: Number,
      default: 0,
      min: [0, "Input price cannot be negative"],
    },

    // ── OUTPUT ─────────────────────────────────────────────
    outputQuantity: {
      type: Number,
      required: [true, "Output quantity is required"],
      min: [0, "Output quantity cannot be negative"],
    },

    outputUnit: {
      type: String,
      enum: ["L", "kg", "KG", "Liters"], // ADDED "Liters"
      required: [true, "Output unit is required"],
      default: "L",
    },

    outputPrice: {
      type: Number,
      default: 0,
      min: [0, "Output price cannot be negative"],
    },

    // ── LOSS & COSTS ──────────────────────────────────────
    lossPercent: {
      type: Number,
      default: 0,
      min: [0, "Loss percentage cannot be negative"],
      max: [100, "Loss percentage cannot exceed 100"],
    },

    laborCost: {
      type: Number,
      required: [true, "Labor cost is required"],
      min: [0, "Labor cost cannot be negative"],
      default: 0,
    },

    energyCost: {
      type: Number,
      required: [true, "Energy cost is required"],
      min: [0, "Energy cost cannot be negative"],
      default: 0,
    },

    totalCost: {
      type: Number,
      default: 0,
    },

    costPerUnit: {
      type: Number,
      default: 0,
    },

    // ── METADATA ──────────────────────────────────────────
    date: {
      type: Date,
      default: Date.now,
      required: [true, "Production date is required"],
    },

    notes: {
      type: String,
      trim: true,
      default: "",
    },

    status: {
      type: String,
      // ALIGNED with route — lowercase hyphenated
      enum: ["pending", "in-progress", "completed", "cancelled"],
      default: "completed",
    },

    batchId: {
      type: String,
      default: null,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

/**
 * PRE-SAVE HOOK
 * Auto-calculate loss, costs, and batch ID
 */
productionSchema.pre("save", async function () {
  // ── CALCULATE LOSS % ──
  if (this.inputQuantity > 0) {
    this.lossPercent = parseFloat(
      (
        ((this.inputQuantity - this.outputQuantity) /
          this.inputQuantity) *
        100
      ).toFixed(2)
    );
  } else {
    this.lossPercent = 0;
  }

  // Clamp to 0–100
  if (this.lossPercent < 0) this.lossPercent = 0;
  if (this.lossPercent > 100) this.lossPercent = 100;

  // ── CALCULATE TOTAL COST ──
  // FIXED: Now includes input material cost (inputQuantity × inputPrice)
  const inputMaterialCost = (this.inputQuantity || 0) * (this.inputPrice || 0);
  const productionCost = (this.laborCost || 0) + (this.energyCost || 0);
  this.totalCost = inputMaterialCost + productionCost;

  // ── CALCULATE COST PER UNIT ──
  if (this.outputQuantity > 0) {
    this.costPerUnit = parseFloat(
      (this.totalCost / this.outputQuantity).toFixed(2)
    );
  } else {
    this.costPerUnit = 0;
  }

  // ── GENERATE BATCH ID ──
  if (!this.batchId) {
    const date = new Date()
      .toISOString()
      .slice(0, 10)
      .replace(/-/g, "");

    this.batchId = `${this.process
      .toUpperCase()
      .slice(0, 3)}${date}${Math.random()
      .toString(36)
      .substr(2, 5)
      .toUpperCase()}`;
  }
});

/**
 * INDEXES
 */
productionSchema.index({ process: 1 });
productionSchema.index({ date: -1 });
productionSchema.index({ status: 1 });
productionSchema.index({ date: -1, process: 1 });

const Production = mongoose.model("Production", productionSchema);

export default Production;