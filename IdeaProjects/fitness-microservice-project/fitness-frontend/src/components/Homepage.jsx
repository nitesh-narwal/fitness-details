import { useContext, useEffect } from 'react';
import { AuthContext } from 'react-oauth2-code-pkce';
import { Link } from 'react-router-dom';
import './Homepage.css';

function Homepage() {
  const { logIn } = useContext(AuthContext);

  const handleLogin = (e) => {
    e.preventDefault();
    logIn();
  };

  useEffect(() => {
    const texts = [
      'Track_your_fitness_journey_with_precision_analytics...',
      'Set_goals_and_achieve_milestones_systematically...',
      'Get_personalized_insights_powered_by_AI_algorithms...',
      'Transform_data_into_actionable_fitness_strategies...'
    ];
    
    let textIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    let typingSpeed = 80;

    function typeText() {
      const currentText = texts[textIndex];
      const typingElement = document.getElementById('typing-text');

      if (!typingElement) return;

      if (!isDeleting && charIndex < currentText.length) {
        typingElement.textContent = currentText.substring(0, charIndex + 1);
        charIndex++;
        typingSpeed = 80;
      } else if (isDeleting && charIndex > 0) {
        typingElement.textContent = currentText.substring(0, charIndex - 1);
        charIndex--;
        typingSpeed = 40;
      } else if (!isDeleting && charIndex === currentText.length) {
        isDeleting = true;
        typingSpeed = 2000;
      } else if (isDeleting && charIndex === 0) {
        isDeleting = false;
        textIndex = (textIndex + 1) % texts.length;
        typingSpeed = 500;
      }

      setTimeout(typeText, typingSpeed);
    }

    const timeout = setTimeout(typeText, 1000);
    return () => clearTimeout(timeout);
  }, []);

  return (
    <div className="homepage">
      <div className="grid-overlay"></div>

      {/* Navigation */}
      <nav>
        <div className="logo">
          <svg className="logo-icon" viewBox="0 0 24 24">
            <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z"/>
          </svg>
          <div>
            <div className="logo-text">FITNESS TIPS</div>
            <span className="logo-subtitle">HEALTH SYSTEM</span>
          </div>
        </div>
        <div className="nav-links">
          <a href="#features" className="nav-link">FEATURES</a>
          <a href="#about" className="nav-link">ABOUT</a>
          <a href="#contact" className="nav-link">CONTACT</a>
          {/* <Link to="/register" className="nav-link register-link">REGISTER</Link> */}
          <button className="get-started-btn" onClick={handleLogin}>LOGIN</button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-intro">
            <div className="status-indicator"></div>
            <span className="hero-greeting">SYSTEM ONLINE</span>
          </div>
          
          <h1 className="hero-title">
            TRANSFORM YOUR<br/>
            LIFESTYLE WITH DATA
          </h1>

          <div className="typing-container">
            <div className="typing-line">
              <span>&gt;</span>
              <span id="typing-text"></span>
              <span className="cursor"></span>
            </div>
          </div>

          <div className="glass-section" id="about">
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-number">10K+</div>
                <div className="stat-label">ACTIVE USERS</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">98%</div>
                <div className="stat-label">SUCCESS RATE</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">50+</div>
                <div className="stat-label">WORKOUT PLANS</div>
              </div>
              <div className="stat-card">
                <div className="stat-number">24/7</div>
                <div className="stat-label">SUPPORT</div>
              </div>
            </div>
            <div className="about-text">
              A comprehensive fitness tracking platform designed for individuals passionate about achieving their health goals. Monitor daily activities, receive personalized insights, and transform aspirations into measurable achievements through intuitive interfaces and data-driven recommendations.
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section" id="features">
        <div className="section-header">
          <h2 className="section-title">CORE FEATURES</h2>
          <button className="view-all-btn">
            VIEW ALL
            <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor">
              <path d="M8.59 16.59L13.17 12 8.59 7.41 10 6l6 6-6 6z"/>
            </svg>
          </button>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg className="feature-icon" viewBox="0 0 24 24">
                <path d="M16 6l2.29 2.29-4.88 4.88-4-4L2 16.59 3.41 18l6-6 4 4 6.3-6.29L22 12V6z"/>
              </svg>
            </div>
            <h3 className="feature-title">ACTIVITY TRACKING</h3>
            <p className="feature-description">
              Monitor your daily workouts, calories burned, and progress over time with detailed analytics and visual representations.
            </p>
            <span className="feature-tag">CORE MODULE</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg className="feature-icon" viewBox="0 0 24 24">
                <path d="M9 11H7v2h2v-2zm4 0h-2v2h2v-2zm4 0h-2v2h2v-2zm2-7h-1V2h-2v2H8V2H6v2H5c-1.11 0-1.99.9-1.99 2L3 20c0 1.1.89 2 2 2h14c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 16H5V9h14v11z"/>
              </svg>
            </div>
            <h3 className="feature-title">GOAL PLANNING</h3>
            <p className="feature-description">
              Set personalized fitness goals and receive intelligent recommendations to help you achieve them efficiently.
            </p>
            <span className="feature-tag">POPULAR</span>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg className="feature-icon" viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z"/>
              </svg>
            </div>
            <h3 className="feature-title">SMART INSIGHTS</h3>
            <p className="feature-description">
              Get AI-powered recommendations and insights based on your activity patterns and performance metrics.
            </p>
            <span className="feature-tag">AI POWERED</span>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <button className="login-btn" onClick={handleLogin}>
          START JOURNEY
          <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8z"/>
          </svg>
        </button>
        <p className="cta-subtitle">
          Don't have an account? <Link to="/register" className="cta-register-link">Create one here</Link>
        </p>
      </section>
    </div>
  );
}

export default Homepage;