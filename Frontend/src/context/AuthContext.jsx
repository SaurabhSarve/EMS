import React , {createContext , useState , useContext , useEffect} from 'react';
import authService from '../services/auth';


const AuthContext = createContext();


export const useAuth = () => {
    return useContext(AuthContext);

};

export const AuthProvider = ({children}) => {
    const [user,setUser] = useState(null);
    const [loading , setLoading] = useState(true);

    useEffect(() => {
      const checkAuth = () => {
        const currentUser = authService.getCurrentUser();
        if(currentUser) {
            setUser(currentUser);

        }
        setLoading(false);
      }

      checkAuth();
    },[]);

    const login = async (email,password, accessKey ,employeeId , loginType) => {
       
        const result = await authService.login(email, password , accessKey, employeeId , loginType);
 
       return result;
        

    }

    const register = async(form) => {
        const result = await authService.register(form);
 
       return result;
    }

    const logout = () => {
        authService.logout();
        setUser(null);
    };

    const value = {
        user,
        loading,
        login,
        logout,
        register
        
    }

    return(
 <AuthContext.Provider value={value}>
    {children}
    </AuthContext.Provider>
);
};