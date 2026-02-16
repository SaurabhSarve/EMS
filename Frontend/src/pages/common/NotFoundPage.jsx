import { Link } from "react-router-dom";

const NotFound = () => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      background: "#f5f5f5"
    }}>
      <h1 style={{ fontSize: "120px", margin: "0", color: "#333" }}>404</h1>
      <h2 style={{ fontSize: "32px", marginBottom: "10px" }}>Page Not Found</h2>
      <p style={{ fontSize: "18px", color: "#666", marginBottom: "30px" }}>
        The page you're looking for doesn't exist.
      </p>
      <Link 
        to="/" 
        style={{ 
          padding: "12px 30px", 
          background: "#007bff", 
          color: "white", 
          textDecoration: "none",
          borderRadius: "5px",
          fontSize: "16px"
        }}
      >
        Go to Home
      </Link>
    </div>
  );
};

export default NotFound;