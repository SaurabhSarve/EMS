const express = require('express').default || require('express');
const mongoose = require("mongoose");
const cors = require("cors");
const dotenv = require("dotenv");
const { connection } = require("mongoose");
const apiRoutes = require('./routes/index');
dotenv.config();

const app = express();

app.use(cors({
  origin: 'http://localhost:5173', 
  credentials: true, 
  methods: ['GET', 'POST', 'PUT','PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization' ,'X-Password',
    'X-Hard-Delete' , 'X-Status']
}));

app.use(express.json());
app.use(express.urlencoded({extended : true}));


const connectTodb = async() => {
    try{
    console.log(`🔗 Connecting to: ${process.env.MONGODB_URL}`);
    const conn = await mongoose.connect(process.env.MONGODB_URL || 'mongodb://127.0.0.1:27017/ems_database');
    console.log(`mongodb(database) connected successfully`);

    }catch(err){
        console.error(`MongoDB Connection Error: ${err.message}`);

    }
}


const PORT = process.env.PORT || 5000;

app.get('/', (req, res) => {
    res.json({
        success: true,
        message: '🚀 EMS Backend API is running!',
        version: '1.0.0',
    });
});

app.use("/api/v1" , apiRoutes);

app.use((err , req,res,next) => {
    
    const {statusCode = 500 , message = "server Error"} = err;
    res.status(statusCode).json({"message" : `${message}`});
  
})


const startServer = async () => {
 try{

    await connectTodb();

    const server = app.listen(PORT , () => {
        console.log(`EMS Backend Server Started`);
              console.log(`Port: ${PORT}`);
      console.log(`Environment: ${process.env.NODE_ENV}`);


    })

    server.on('error' , (error) => {
        console.error('Server error:', error);

    })
 }catch(error){
        console.error(' Failed to start server:', error);

 }
}

startServer();