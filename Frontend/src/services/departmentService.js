import api from './api'
export const departmentService  = {
createDepartment : async(departmentData) => {
 try {
                  const response = await api.post(`/admin/departments`, departmentData);
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },

    deleteDepartment : async(id) => {
 try {
                  const response = await api.delete(`/admin/departments/${id}`);
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },
      updateDepartment: async (id, departmentData) => {
        try {
                  const response = await api.put(`/admin/departments/${id}` , departmentData);
                  return response.data;
              } catch (error) {
                  throw error;
              }
      }


}
  
