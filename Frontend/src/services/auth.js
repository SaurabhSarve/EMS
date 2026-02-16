
import api from './api';


export const authService = {
    login : async(email,password,accessKey,employeeId , loginType) => {
        
      
            
            const response = await api.post('/auth/login', {
                email,
                password,
                accessKey,
                employeeId,
                loginType
            });

            if (response.data.success) {
        localStorage.setItem('token', response.data.token);
        localStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;

      
      
   },
   register: async (form) => {
  const response = await api.post('/auth/register', {form});

//   if (response.data.success) {
//     if (response.data.token) {
//       localStorage.setItem('token', response.data.token);
//     }
//     if (response.data.user) {
//       localStorage.setItem('user', JSON.stringify(response.data.user));
//     }
//   }

  return response.data;
},


    logout : () => {
        localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href= "/";
    },

    getCurrentUser: () => {
    const userStr = localStorage.getItem('user');
    return userStr ? JSON.parse(userStr) : null;

    },

    getToken : () => {
        return localStorage.getItem('token');
    },

    requestForgotpassword  : async(employeeId , email , userType) => {
        const response = await api.post("/auth/forgot-password/request",{
          employeeId,
          email,
          userType
        })
        return response.data;

      }
       ,
       verifyOtp : async (identifier,otp,userType) => {
         const response = await api.post("/auth/forgot-password/verify-otp",{
          identifier,
          otp,
          userType
        })
        return response.data;
       }
       ,
       resetPassword : async (identifier,otp,newPassword,confirmPassword,userType,adminSecretkey , departmentSecretkey , name) => {
         const response = await api.post("/auth/forgot-password/reset",{
          identifier,

          otp,
          password : newPassword,
          confirmPassword,
          userType,
          adminSecretkey,
          departmentSecretkey,
          name
        })
        return response.data;
       }
    
    
};

export default authService;