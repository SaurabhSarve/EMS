import api from './api';

export const salaryService = {
    getEmployeesSalary : async() => {
      try {
                  const response = await api.get('/admin/employees/salary');
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },

    updateEmployeeSalary :  async (updateData) => {
        try {
                  const response = await api.post(`/admin/employees/salary` ,{
                    updateData : updateData
                  });
                  return response.data;
              } catch (error) {
                  throw error;
              }
    }

    ,
    runEmployeePayroll : async(updatedEmployees) => {
         try {
                  const response = await api.post(`/admin/employees/salary/run-payroll` , {
                    updatedEmployees
                  });
                  return response.data;
              } catch (error) {
                  throw error;
              }
    }





}
