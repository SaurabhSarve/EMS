import api from './api';

export const leaveService = {
    applyLeave : async (leaveData) => {
        try {
            const response = await api.post('employee/apply-leave',{
                leaveData
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAppliedLeave :  async () => {
        try {
            const response = await api.get('employee/apply-leave');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    leaveAction : async (Leaveid ,value) => {
        try {
            const response = await api.post('admin/employees/leaves' , {
                Leaveid,
                action : value
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    

}