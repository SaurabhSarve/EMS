import api from './api';

export const salaryService = {
    getEmployeesSalary: async () => {
        try {
            const response = await api.get('/admin/employees/salary');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateEmployeeSalary: async (updateData) => {
        try {
            const response = await api.post(`/admin/employees/salary`, {
                updateData: updateData
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    }

    ,
    runEmployeePayroll: async (updatedEmployees) => {
        try {
            const response = await api.post(`/admin/employees/salary/run-payroll`, {
                updatedEmployees
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAllEmployeeDuePayment: async () => {
        try {
            const apiResponse = await api.get('/admin/employees/salary/allDue');
            return apiResponse.data;
        } catch (error) {
            throw error;
        }
    },

    permantentSalary: async (formData) => {
        try {
            const apiResponse = await api.patch('/admin/employees/permententSalaryUpdate', formData);
            return apiResponse.data;
        } catch (error) {
            throw error;
        }
    },

    employeePayRollHistory: async (formData) => {
        try {
            const apiResponse = await api.post("/admin/employees/id/filter", formData);
            return apiResponse.data
        }
        catch (err) {
            throw err
        }
    }

}
