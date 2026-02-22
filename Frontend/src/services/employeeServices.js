// import { deleteDepartmentHeadTicket } from '../../../Backend/controllers/supportTicketController';
import api from './api';

export const employeeService = {
    getRecentActivities: async () => {
        try {
            const response = await api.get('/admin/recent-activities');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
    ,
    getTickets: async () => {
        try {
            const response = await api.get('/admin/tickets');
            return response.data;
        } catch (error) {
            throw error;
        }
    }
    ,
    getAdminDashboardStats: async () => {
        try {
            const response = await api.get('/admin/dashboard/stats');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAllEmployees: async () => {
        try {
            const response = await api.get('/admin/employees',);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAllEmployeesByDeparment: async (department) => {
        try {
            const response = await api.get(`/admin/employees/bydepartment?department=${department}`,);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    addEmployee: async (data) => {
        try {
            const response = await api.post('/admin/employees', data, {
                headers: {
                    'Content-Type': 'multipart/form-data'  // Override default
                }
            });
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    getDetailsbyId: async (id) => {
        try {
            const response = await api.get(`/admin/employee/${id}`);
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    addTask: async (employeeId, tasksData) => {
        try {
            const response = await api.post(`/admin/employee/${employeeId}/addtask`, tasksData);
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    getLeavesdetails: async () => {
        try {
            const response = await api.get(`/admin/employees/leaves`);
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    updateEmployee: async (id, updatedData) => {
        try {
            const response = await api.put(`/admin/employee/${id}`, updatedData, {
                headers: {
                    'Content-Type': 'multipart/form-data'  // Override default
                }
            });
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    updateProfile: async (formDatatoSend) => {
        try {
            const response = await api.put(`/admin/me`, formDatatoSend, {
                headers: {
                    'Content-Type': 'multipart/form-data'  // Override default
                }
            });
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    getProfile: async () => {
        try {
            const response = await api.get(`/employee/me`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },



    deleteEmployee: async (id, password, hardDelete, status) => {

        try {
            const response = await api.delete(`/admin/employee/${id}`, {
                headers: {
                    'X-Password': password,
                    'X-Hard-Delete': hardDelete,
                    'X-Status': status
                }
            });
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    getEmployeedashboardStats: async () => {

        try {
            const response = await api.get(`/employee/dashboard`);
            return response.data;

        } catch (error) {
            throw error;
        }
    },
    getDepartmentTasks: async () => {
        try {
            const response = await api.get(`/admin/employees/tasks`);
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    getTasks: async () => {

        try {
            const response = await api.get(`/employee/tasks`);
            return response.data;

        } catch (error) {
            throw error;
        }
    }
    ,
    updateTask: async (taskId) => {
        try {
            const response = await api.post(`/employee/tasks`, { taskId });
            return response.data;

        } catch (error) {
            throw error;
        }
    }
    ,


    addTaskComment: async (taskId, comment) => {
        try {
            const response = await api.post(`/employee/tasks/${taskId}/comments`, { comment });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    uploadTaskFile: async (taskId, formData) => {
        try {
            const response = await api.post(`/employee/tasks/${taskId}/upload`, formData, {
                headers: {
                    'Content-Type': 'multipart/form-data'
                }
            });
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateTicketStatus: (ticketId, payload) => {
        return api.patch(`/admin/support-tickets/${ticketId}/status`,
            payload // { status, comment }
        );
    },

    // getProfile: async () => {
    //     deleteTask: async (taskId) => {
    //         try {
    //             const response = await api.delete(`/admin/tasks/${taskId}`);
    //             return response.data;

    //         } catch (error) {
    //             throw error;
    //         }
    //     }
    // },
    deleteTask: async (taskId) => {
        try {
            const response = await api.delete(`/admin/tasks/${taskId}`);
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    getTasks: async () => {

        try {
            const response = await api.get(`/employee/tasks`);
            return response.data;

        } catch (error) {
            throw error;
        }
    },

    updateTaskByAdmin: async (taskId, updateData) => {
        try {
            const response = await api.patch(`/admin/tasks/${taskId}`, updateData);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    updateTicket: async (ticketId) => {
        try {
            const response = await api.patch(`/admin/support-tickets/${ticketId}/mark-read`, { ticketId });
            return response.data;

        } catch (error) {
            throw error;
        }
    },
    //     updateTicketStatus : async(ticketId, status) => {
    //         try{
    // const response = await api.patch(`/admin/support-tickets/${ticketId}/status`,{ status } );
    // return response.data;

    updateTicketStatus: (ticketId, payload) => {
        try {
            return api.patch(
                `/admin/support-tickets/${ticketId}/status`,
                payload // { status, comment }
            );
        }
        catch (error) {
            throw error
        }
    },
    changePassword: async (data) => {
        try {
            const response = await api.post(`/employee/change-password`, data);
            return response.data;

        } catch (error) {
            throw error;
        }
    },
    updateSecurityKey: async (data) => {
        try {
            const response = await api.put(`/employee/update-security-key`, data);
            return response.data;

        } catch (error) {
            throw error;
        }
    },


    forwardTicketToAdmin: (ticketId) => {
        return api.put(`/admin/tickets/${ticketId}/forward-to-admin`);
    },

    getDepartmentHeadQueries: async () => {
        try {
            const response = await api.get('/admin/tickets/department-head-queries');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getMyQueries: async () => {
        try {
            const response = await api.get('/admin/tickets/my-queries');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getDepartmentEmployeesTickets: async () => {
        try {
            const response = await api.get('/admin/tickets/department-employees');
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    employeePromotion: async (department, formData) => {
        try {
            const apiResponse = await api.put(`/admin/employees/promotion?department=${department}`, { formData })
            return apiResponse.data
        }
        catch (err) {
            throw err
        }
    },

    deleteEmployeeTickets: async (ticketId) => {
        try {
            const response = await api.delete(`/admin/support-tickets/${ticketId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    getAllEmployeesByDepartment: async (department) => {
        try {
            const response = await api.get(`/admin/employees/bydepartment?department=${department}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },

    deleteDepartmentHeadTicket: async (ticketId) => {
        try {
            const response = await api.delete(`/admin/support-tickets/department-head/${ticketId}`);
            return response.data;
        } catch (error) {
            throw error;
        }
    },
    getDepartmentHeadEmployees: async() => {
        try {
            const response = await api.get(`/admin/head/employess`);
            return response.data;
        } catch (error) {
            throw error;
        }
    }
};

