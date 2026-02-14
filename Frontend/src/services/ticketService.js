import api from './api.js'

export const ticketService = {
    createTicket : async(ticketData) => {
      try {
                  const response = await api.post('/employee/support/tickets' , ticketData);
                  return response.data;
              } catch (error) {
                  throw error;
              }
    },
    getMyTickets : async() => {
        try {
                  const response = await api.get("/employee/support/tickets");
                  return response.data;
              } catch (error) {
                  throw error;
              }
    }
    
}