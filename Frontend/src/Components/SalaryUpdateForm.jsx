import React from "react";
import { X } from "lucide-react";

export default function UpdateSalaryModal({
  show,
  onClose,
  updateFormData,
  setUpdateFormData,
  onSubmit
}) {
  if (!show) return null;

  return (
    <div className="fixed inset-0 backdrop-blur-lg bg-white/20 z-50 flex items-center justify-center p-4">
      <div className="bg-white/90 backdrop-blur-lg rounded-xl shadow-2xl max-w-md w-full p-6 border border-white/40">

        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-lg sm:text-xl font-bold text-gray-900">
            Update Salary Details
          </h3>

          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600"
          >
            <X size={24} />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={onSubmit} className="space-y-4">

          {/* Base Salary */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Base Salary (₹)
            </label>
            <input
              type="number"
              value={updateFormData.baseSalary}
              onChange={(e) =>
                setUpdateFormData({
                  ...updateFormData,
                  baseSalary: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Allowances */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Allowances (₹)
            </label>
            <input
              type="number"
              value={updateFormData.allowances}
              onChange={(e) =>
                setUpdateFormData({
                  ...updateFormData,
                  allowances: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Tax */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Tax (%)
            </label>
            <input
              type="number"
              value={updateFormData.taxApply}
              onChange={(e) =>
                setUpdateFormData({
                  ...updateFormData,
                  taxApply: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Deductions */}
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              Deductions (₹)
            </label>
            <input
              type="number"
              value={updateFormData.deductions}
              onChange={(e) =>
                setUpdateFormData({
                  ...updateFormData,
                  deductions: e.target.value,
                })
              }
              className="w-full px-4 py-2 border rounded-lg"
              required
            />
          </div>

          {/* Net Salary Preview */}
          <div className="bg-blue-50 p-4 rounded-lg border">
            <p className="text-sm text-gray-600">Calculated Net Salary:</p>

            <p className="text-xl font-bold text-blue-600">
              ₹
              {(
                (parseFloat(updateFormData.baseSalary) || 0) +
                (parseFloat(updateFormData.allowances) || 0) -
                (parseFloat(updateFormData.deductions) || 0) -
                ((parseFloat(updateFormData.baseSalary) || 0) *
                  (parseFloat(updateFormData.taxApply) || 0)) /
                  100
              ).toFixed(2)}
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border rounded-lg"
            >
              Cancel
            </button>

            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg"
            >
              Update Salary
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
