import api from './api';

export const emailService = {
    registraionEmail : async (formData , employeeId) => {
        try {
            const response = await api.post('/admin/employees/sent-email' , {
                formData : formData,
                employeeId : employeeId
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    createPassword : async(form) => {
 try {
            const response = await api.post('/auth/create-password' ,form);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
   
}