import { Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { COLORS } from "../theme";

export default function Footer() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentDate(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();
    const startingDay = firstDay.getDay();
    
    const days = [];
    for (let i = 0; i < startingDay; i++) {
      days.push(null);
    }
    for (let i = 1; i <= daysInMonth; i++) {
      days.push(i);
    }
    return days;
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString('en-US', { 
      hour: '2-digit', 
      minute: '2-digit', 
      second: '2-digit' 
    });
  };

  const days = getDaysInMonth(selectedDate);
  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const wrap = { 
    background: COLORS.brown, 
    color: "#fff", 
    marginTop: 0,
    boxShadow: "0 -4px 20px rgba(0,0,0,0.1)",
    position: "relative",
    bottom: 0,
    width: "100%"
  };
  
  const container = { 
    maxWidth: 1200, 
    margin: "0 auto", 
    padding: "40px 16px", 
    display: "grid", 
    gridTemplateColumns: "1fr 1fr 1fr 1fr", 
    gap: 32 
  };
  
  const link = { 
    color: "#fff", 
    textDecoration: "none", 
    lineHeight: "28px",
    transition: "color 0.3s ease",
    ":hover": { color: "#e0e0e0" }
  };
  
  const sectionTitle = { 
    fontWeight: 700, 
    marginBottom: 16, 
    fontSize: "18px",
    borderBottom: "2px solid rgba(255,255,255,0.3)",
    paddingBottom: "8px"
  };

  const calendarContainer = {
    background: "rgba(255,255,255,0.1)",
    borderRadius: "12px",
    padding: "16px",
    backdropFilter: "blur(10px)"
  };

  const calendarHeader = {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: "16px"
  };

  const calendarGrid = {
    display: "grid",
    gridTemplateColumns: "repeat(7, 1fr)",
    gap: "4px",
    textAlign: "center"
  };

  const calendarDay = {
    padding: "8px 4px",
    fontSize: "12px",
    cursor: "pointer",
    borderRadius: "4px",
    transition: "background 0.2s ease"
  };

  const currentDayStyle = {
    background: "rgba(255,255,255,0.3)",
    fontWeight: "bold"
  };

  const selectedDayStyle = {
    background: "rgba(255,255,255,0.5)",
    fontWeight: "bold"
  };

  const weekdayHeader = {
    padding: "8px 4px",
    fontSize: "12px",
    fontWeight: "bold",
    color: "rgba(255,255,255,0.8)"
  };

  const timeDisplay = {
    fontSize: "14px",
    marginTop: "12px",
    textAlign: "center",
    padding: "8px",
    background: "rgba(255,255,255,0.1)",
    borderRadius: "6px"
  };

  return (
    <footer style={wrap}>
      <div style={container}>
        {/* Company Info */}
        <div>
          <div style={sectionTitle}>Green Lion</div>
          <div style={{ marginBottom: 8 }}>Premium coir & coco products</div>
          <div style={{ marginBottom: 8 }}>Moratuwa, Sri Lanka</div>
          <div style={{ marginBottom: 8 }}>
            <strong>Phone:</strong> +94 11 123 4567
          </div>
          <div>
            <strong>Email:</strong> info@greenlion.com
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <div style={sectionTitle}>Quick Links</div>
          <div style={{ marginBottom: 8 }}>
            <Link to="/" style={link}>Home</Link>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Link to="/products" style={link}>Products</Link>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Link to="/about" style={link}>About Us</Link>
          </div>
          <div style={{ marginBottom: 8 }}>
            <Link to="/contact" style={link}>Contact</Link>
          </div>
        </div>

        {/* Support & Services */}
        <div>
          <div style={sectionTitle}>Support & Services</div>
          <div style={{ marginBottom: 8 }}>
            <a href="mailto:support@greenlion.com" style={link}>Customer Support</a>
          </div>
          <div style={{ marginBottom: 8 }}>
            <a href="mailto:sales@greenlion.com" style={link}>Sales Inquiries</a>
          </div>
          <div style={{ marginBottom: 8 }}>
            <a href="mailto:wholesale@greenlion.com" style={link}>Wholesale</a>
          </div>
          <div style={{ marginBottom: 8 }}>
            <a href="/shipping" style={link}>Shipping Info</a>
          </div>
        </div>

        {/* Calendar Section */}
        <div>
          <div style={sectionTitle}>Today's Date</div>
          <div style={calendarContainer}>
            <div style={calendarHeader}>
              <button 
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() - 1, 1))}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "background 0.2s ease"
                }}
              >
                ‹
              </button>
              <div style={{ fontWeight: "bold", fontSize: "14px" }}>
                {monthNames[selectedDate.getMonth()]} {selectedDate.getFullYear()}
              </div>
              <button 
                onClick={() => setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth() + 1, 1))}
                style={{
                  background: "none",
                  border: "none",
                  color: "#fff",
                  cursor: "pointer",
                  fontSize: "16px",
                  padding: "4px 8px",
                  borderRadius: "4px",
                  transition: "background 0.2s ease"
                }}
              >
                ›
              </button>
            </div>
            
            <div style={calendarGrid}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                <div key={day} style={weekdayHeader}>{day}</div>
              ))}
              {days.map((day, index) => (
                <div 
                  key={index} 
                  style={{
                    ...calendarDay,
                    ...(day === currentDate.getDate() && 
                         selectedDate.getMonth() === currentDate.getMonth() && 
                         selectedDate.getFullYear() === currentDate.getFullYear() ? currentDayStyle : {}),
                    ...(day === selectedDate.getDate() ? selectedDayStyle : {}),
                    opacity: day ? 1 : 0.3
                  }}
                  onClick={() => day && setSelectedDate(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), day))}
                >
                  {day || ''}
                </div>
              ))}
            </div>
            
            <div style={timeDisplay}>
              <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                {formatDate(currentDate)}
              </div>
              <div style={{ fontSize: "12px", opacity: 0.9 }}>
                {formatTime(currentDate)}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Bar */}
      <div style={{ 
        borderTop: "1px solid rgba(255,255,255,0.2)", 
        padding: "20px 16px", 
        textAlign: "center",
        background: "rgba(0,0,0,0.1)"
      }}>
        <div style={{ marginBottom: "8px" }}>
          © {new Date().getFullYear()} Green Lion. All rights reserved.
        </div>
        <div style={{ fontSize: "14px", opacity: 0.8 }}>
          Premium coir & coconut products from Sri Lanka
        </div>
      </div>
    </footer>
  );
}
