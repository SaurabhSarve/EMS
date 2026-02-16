import React, { useState, useEffect } from "react";
import { employeeService } from "../services/employeeServices";

const PromotionForm = ({
    employee,
    department,
    departmentHead = null,
    onClose
}) => {
    const [promotionData, setPromotionData] = useState({
        promotedPostion: "",
        oldEmployeeId: "",
        oldEmployeeNewPosition: "",
        newSalaryPromoted: {
            baseSalary: "",
            allowances: "",
            deductions: "",
            taxApply: "",
            netSalary: ""
        },
        newSalary: {
            baseSalary: "",
            allowances: "",
            deductions: "",
            taxApply: "",
            netSalary: ""
        }
    });

    const [isPromoting, setIsPromoting] = useState(false);


    useEffect(() => {
        if (!employee) return;

        setPromotionData((prev) => ({
            ...prev,
            newSalaryPromoted: {
                baseSalary: employee.baseSalary ?? "",
                allowances: employee.allowances ?? "",
                deductions: employee.deductions ?? "",
                taxApply: employee.taxApply ?? "",
                netSalary: employee.netSalary ?? ""
            }
        }));
    }, [employee]);

    useEffect(() => {
        if (!departmentHead) return;

        setPromotionData((prev) => ({
            ...prev,
            oldEmployeeId: departmentHead._id,
            newSalary: {
                baseSalary: departmentHead.baseSalary ?? "",
                allowances: departmentHead.allowances ?? "",
                deductions: departmentHead.deductions ?? "",
                taxApply: departmentHead.taxApply ?? "",
                netSalary: departmentHead.netSalary ?? ""
            }
        }));
    }, [departmentHead]);

    useEffect(() => {
        const { baseSalary, allowances, deductions, taxApply } =
            promotionData.newSalaryPromoted;

        const base = Number(baseSalary) || 0;
        const allow = Number(allowances) || 0;
        const deduct = Number(deductions) || 0;
        const taxPercent = Number(taxApply) || 0;

        const gross = base + allow - deduct;
        const taxAmount = (gross * taxPercent) / 100;
        const net = gross - taxAmount;

        setPromotionData((prev) => ({
            ...prev,
            newSalaryPromoted: {
                ...prev.newSalaryPromoted,
                netSalary: net > 0 ? Math.round(net) : 0
            }
        }));
    }, [
        promotionData.newSalaryPromoted.baseSalary,
        promotionData.newSalaryPromoted.allowances,
        promotionData.newSalaryPromoted.deductions,
        promotionData.newSalaryPromoted.taxApply
    ]);

    useEffect(() => {
        const { baseSalary, allowances, deductions, taxApply } =
            promotionData.newSalary;

        const base = Number(baseSalary) || 0;
        const allow = Number(allowances) || 0;
        const deduct = Number(deductions) || 0;
        const taxPercent = Number(taxApply) || 0;

        const gross = base + allow - deduct;
        const taxAmount = (gross * taxPercent) / 100;
        const net = gross - taxAmount;

        setPromotionData((prev) => ({
            ...prev,
            newSalary: {
                ...prev.newSalary,
                netSalary: net > 0 ? Math.round(net) : 0
            }
        }));
    }, [
        promotionData.newSalary.baseSalary,
        promotionData.newSalary.allowances,
        promotionData.newSalary.deductions,
        promotionData.newSalary.taxApply
    ]);

    if (!employee) return null;

    const handleRoleChange = (e) => {
        setPromotionData((prev) => ({
            ...prev,
            promotedPostion: e.target.value
        }));
    };

    const handleSalaryChange = (e, type) => {
        const { name, value } = e.target;

        setPromotionData((prev) => ({
            ...prev,
            [type]: {
                ...prev[type],
                [name]: value
            }
        }));
    };

    const handleSubmit = async () => {
        const formData = {
            promotedEmployeeId: employee._id,
            promotedPostion: promotionData.promotedPostion,
            newSalaryPromoted: promotionData.newSalaryPromoted,
            oldEmployeeId: promotionData.oldEmployeeId,
            oldEmployeeNewPosition: promotionData.oldEmployeeNewPosition,
            newSalary: promotionData.newSalary
        };

        try {
            await employeeService.employeePromotion(department, formData);
            window.location.reload();
            onClose();
        } catch (err) {
            console.error("Promotion error:", err);
        } finally {
            setIsPromoting(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm flex items-center justify-center z-50">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">

                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Promote Employee</h2>
                    <button onClick={onClose} className="text-gray-500 text-lg">✕</button>
                </div>

                <div className="mb-4 p-3 bg-gray-50 rounded-lg space-y-1">
                    <div>
                        <span className="font-semibold text-gray-700">Employee Name:</span>{" "}
                        {employee.firstName} {employee.lastName}
                    </div>

                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Email:</span>{" "}
                        {employee.personalEmail}
                    </div>

                    <div className="text-sm text-gray-600">
                        <span className="font-semibold text-gray-700">Employee ID:</span>{" "}
                        {employee.employeeId}
                    </div>
                </div>

                <div className="mb-4">
                    <label className="text-sm font-semibold">New Role</label>
                    <select
                        value={promotionData.promotedPostion}
                        onChange={handleRoleChange}
                        className="w-full border rounded-lg p-2 mt-1"
                    >
                        <option value="">Select Role</option>
                        <option value="Department Head">Department Head</option>
                        <option value="Admin">Admin</option>
                    </select>
                </div>

                <div className="border-t pt-4">
                    <h3 className="font-semibold mb-3 text-blue-600">
                        Promoted Employee Salary
                    </h3>

                    <div className="grid grid-cols-2 gap-3">
                        <Field label="Base Salary">
                            <input
                                type="number"
                                name="baseSalary"
                                value={promotionData.newSalaryPromoted.baseSalary}
                                onChange={(e) => handleSalaryChange(e, "newSalaryPromoted")}
                                className="border p-2 rounded-lg w-full"
                            />
                        </Field>

                        <Field label="Allowances">
                            <input
                                type="number"
                                name="allowances"
                                value={promotionData.newSalaryPromoted.allowances}
                                onChange={(e) => handleSalaryChange(e, "newSalaryPromoted")}
                                className="border p-2 rounded-lg w-full"
                            />
                        </Field>

                        <Field label="Deductions">
                            <input
                                type="number"
                                name="deductions"
                                value={promotionData.newSalaryPromoted.deductions}
                                onChange={(e) => handleSalaryChange(e, "newSalaryPromoted")}
                                className="border p-2 rounded-lg w-full"
                            />
                        </Field>

                        <Field label="Tax (%)">
                            <input
                                type="number"
                                name="taxApply"
                                value={promotionData.newSalaryPromoted.taxApply}
                                onChange={(e) => handleSalaryChange(e, "newSalaryPromoted")}
                                className="border p-2 rounded-lg w-full"
                            />
                        </Field>

                        <Field label="Net Salary" full>
                            <input
                                type="number"
                                value={promotionData.newSalaryPromoted.netSalary}
                                readOnly
                                className="border p-2 rounded-lg w-full bg-gray-100"
                            />
                        </Field>
                    </div>
                </div>

                {promotionData.promotedPostion === "Department Head" && (
                    <div className="border-t pt-4 mt-5">

                        <h3 className="font-semibold mb-3 text-red-600">
                            Old Department Head Salary (Demotion)
                        </h3>

                        {departmentHead && (
                            <div className="bg-red-50 p-3 rounded-lg text-sm mb-3 space-y-1">
                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Old Department Head Name:
                                    </span>{" "}
                                    {departmentHead.firstName} {departmentHead.lastName}
                                </div>

                                <div>
                                    <span className="font-semibold text-gray-700">Email:</span>{" "}
                                    {departmentHead.personalEmail || departmentHead.email}
                                </div>

                                <div>
                                    <span className="font-semibold text-gray-700">
                                        Employee ID:
                                    </span>{" "}
                                    {departmentHead.employeeId}
                                </div>
                            </div>
                        )}

                        <div className="mb-4">
                            <label className="text-sm font-semibold text-gray-700">
                                Old Department Head New Position
                            </label>

                            <input
                                type="text"
                                placeholder="Enter new position"
                                value={promotionData.oldEmployeeNewPosition}
                                onChange={(e) =>
                                    setPromotionData((prev) => ({
                                        ...prev,
                                        oldEmployeeNewPosition: e.target.value
                                    }))
                                }
                                className="w-full border rounded-lg p-2 mt-1"
                            />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <Field label="Base Salary">
                                <input
                                    type="number"
                                    name="baseSalary"
                                    value={promotionData.newSalary.baseSalary}
                                    onChange={(e) => handleSalaryChange(e, "newSalary")}
                                    className="border p-2 rounded-lg w-full"
                                />
                            </Field>

                            <Field label="Allowances">
                                <input
                                    type="number"
                                    name="allowances"
                                    value={promotionData.newSalary.allowances}
                                    onChange={(e) => handleSalaryChange(e, "newSalary")}
                                    className="border p-2 rounded-lg w-full"
                                />
                            </Field>

                            <Field label="Deductions">
                                <input
                                    type="number"
                                    name="deductions"
                                    value={promotionData.newSalary.deductions}
                                    onChange={(e) => handleSalaryChange(e, "newSalary")}
                                    className="border p-2 rounded-lg w-full"
                                />
                            </Field>

                            <Field label="Tax (%)">
                                <input
                                    type="number"
                                    name="taxApply"
                                    value={promotionData.newSalary.taxApply}
                                    onChange={(e) => handleSalaryChange(e, "newSalary")}
                                    className="border p-2 rounded-lg w-full"
                                />
                            </Field>

                            <Field label="Net Salary" full>
                                <input
                                    type="number"
                                    value={promotionData.newSalary.netSalary}
                                    readOnly
                                    className="border p-2 rounded-lg w-full bg-gray-100"
                                />
                            </Field>
                        </div>
                    </div>
                )}

                <div className="flex justify-end gap-3 mt-6">
                    <button onClick={onClose} className="px-4 py-2 border rounded-lg">
                        Cancel
                    </button>

                    <button
                        onClick={handleSubmit}
                        disabled={isPromoting}
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg flex items-center justify-center gap-2 disabled:bg-gray-400"
                    >
                        {isPromoting ? (
                            <>
                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                Processing...
                            </>
                        ) : (
                            "Promote"
                        )}
                    </button>

                </div>
            </div>
        </div>
    );
};

const Field = ({ label, children, full }) => (
    <div className={full ? "col-span-2" : ""}>
        <label className="text-xs font-semibold text-gray-600">{label}</label>
        {children}
    </div>
);

export default PromotionForm;
