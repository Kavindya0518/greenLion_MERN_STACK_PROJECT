import Header from "./components/Header";
import Footer from "./components/Footer";

export default function Layout({ children }) {
  return (
    <div style={{ 
      minHeight: "100vh", 
      display: "grid",
      gridTemplateRows: "auto 1fr auto",
      gridTemplateAreas: `"header" "main" "footer"`,
      position: "relative"
    }}>
      <div style={{ gridArea: "header" }}>
        <Header />
      </div>
      <main style={{ 
        gridArea: "main",
        display: "flex",
        flexDirection: "column",
        minHeight: "calc(100vh - 200px)",
        paddingTop: "88px",
        paddingBottom: "20px",
        backgroundColor: "#F0FDF4"
      }}>
        {children}
      </main>
      <div style={{ gridArea: "footer" }}>
        <Footer />
      </div>
    </div>
  );
}
