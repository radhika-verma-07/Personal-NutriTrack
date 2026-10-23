import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <main className="home">
      <section className="hero">
        <div className="hero-content">
          <p className="welcome-text">PERSONALIZED FOOD & FITNESS ANALYZER</p>

          <h1>
            Understand What
            <span> You Eat.</span>
          </h1>

          <p className="hero-description">
            Upload your meals, understand your nutrition, and get practical
            suggestions based on your personal requirements.
          </p>

          <button onClick={() => navigate("/login")}>Login</button>

          <button onClick={() => navigate("/profile")}>Create Account</button>
        </div>
      </section>
    </main>
  );
}

export default Home;
