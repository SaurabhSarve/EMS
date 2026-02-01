
import api from './api';

export const paymentService = {
    ActivatePaymentMode : async(secretKey) => {
      try {
                  const response = await api.post('/admin/employees/salary/paymentmode' , {
                    secretKey,
                  });
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },

    UpdateBankDetails : async(editingEmployeeId,bankDetails) => {
 try {
                  const response = await api.put(`/admin/employees/salary/paymentmode` , {
                    editingEmployeeId,
                    bankDetails,
                  });
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },
     payIndividual: async(salaryId) => {
 try {
                  const response = await api.post(`/admin/salary/pay-individual/${salaryId}`);
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },
}