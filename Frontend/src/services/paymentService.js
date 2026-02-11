
import api from './api';

export const paymentService = {
    ActivatePaymentMode: async (secretKey) => {
        try {
            const response = await api.post('/admin/employees/salary/paymentmode', {
                secretKey,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    UpdateBankDetails: async (editingEmployeeId, bankDetails) => {
        try {
            const response = await api.put(`/admin/employees/salary/paymentmode`, {
                editingEmployeeId,
                bankDetails,
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    payIndividual: async (salaryId) => {
        try {
            const response = await api.post(`/admin/salary/pay-individual/${salaryId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    PaymentHistory: async () => {
        try {
            const apiResponse = await api.get("/admin/employees/salary/history");
            return apiResponse.data
        }
        catch (err) {
            throw err
        }
    },
    CustomPaymentHistory: async (startDate, endDate) => {
        try {
            const apiResponse = await api.get(`/admin/employees/salary/customHistory?startDate=${startDate}&endDate=${endDate}`);
            return apiResponse.data
        }
        catch (err) {
            throw err
        }
    },
    DownloadInvoice: async (salaryId) => {
        try {
            const apiResponse = await api.get(`/admin/employees/salary/invoice/${salaryId}`, { responseType: "blob" });
            return apiResponse.data
        }
        catch (err) {
            throw err
        }
    }

}