import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Profile() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    age: "",
    gender: "",
    height: "",
    weight: "",
    activityLevel: "",
    goal: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setError("");

    try {
      const profile = {
        name: formData.name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        age: Number(formData.age),
        gender: formData.gender,
        height: Number(formData.height),
        weight: Number(formData.weight),
        activityLevel: formData.activityLevel,
        goal: formData.goal,
      };

      const response = await fetch(
        "https://personal-nutritrack-api.onrender.com/api/users",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(profile),
        },
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create account");
      }

      // Store the permanent MongoDB ID
      localStorage.setItem("userId", data.user._id);

      // Remove old profile storage
      localStorage.removeItem("userProfile");

      // Go to dashboard
      navigate("/dashboard");
    } catch (error) {
      console.error("Profile creation error:", error);

      setError(error.message || "Unable to create account. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="profile-page">
      <div className="profile-container">
        <div className="profile-heading">
          <p className="small-heading">PERSONAL NUTRITRACK</p>

          <h1>Create Your Account</h1>

          <p>
            Create your profile to receive personalized nutrition and fitness
            guidance.
          </p>
        </div>

        <form className="profile-form" onSubmit={handleSubmit}>
          {/* NAME */}

          <div className="form-group">
            <label>Name</label>

            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Enter your name"
              required
            />
          </div>

          {/* EMAIL */}

          <div className="form-group">
            <label>Email</label>

            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              placeholder="Enter your email"
              required
            />
          </div>

          {/* PASSWORD */}

          <div className="form-group">
            <label>Password</label>

            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              placeholder="Create a password"
              minLength="6"
              required
            />
          </div>

          {/* AGE + GENDER */}

          <div className="form-row">
            <div className="form-group">
              <label>Age</label>

              <input
                type="number"
                name="age"
                value={formData.age}
                onChange={handleChange}
                placeholder="Age"
                min="1"
                max="120"
                required
              />
            </div>

            <div className="form-group">
              <label>Gender</label>

              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                required
              >
                <option value="">Select gender</option>

                <option value="female">Female</option>

                <option value="male">Male</option>

                <option value="other">Other</option>
              </select>
            </div>
          </div>

          {/* HEIGHT + WEIGHT */}

          <div className="form-row">
            <div className="form-group">
              <label>Height (cm)</label>

              <input
                type="number"
                name="height"
                value={formData.height}
                onChange={handleChange}
                placeholder="Height in cm"
                min="50"
                max="250"
                required
              />
            </div>

            <div className="form-group">
              <label>Weight (kg)</label>

              <input
                type="number"
                name="weight"
                value={formData.weight}
                onChange={handleChange}
                placeholder="Weight in kg"
                min="10"
                max="300"
                step="0.1"
                required
              />
            </div>
          </div>

          {/* ACTIVITY */}

          <div className="form-group">
            <label>Activity Level</label>

            <select
              name="activityLevel"
              value={formData.activityLevel}
              onChange={handleChange}
              required
            >
              <option value="">Select activity level</option>

              <option value="sedentary">
                Sedentary - Little or no exercise
              </option>

              <option value="light">Lightly Active - 1 to 3 days/week</option>

              <option value="moderate">
                Moderately Active - 3 to 5 days/week
              </option>

              <option value="active">Very Active - 6 to 7 days/week</option>
            </select>
          </div>

          {/* GOAL */}

          <div className="form-group">
            <label>Goal</label>

            <select
              name="goal"
              value={formData.goal}
              onChange={handleChange}
              required
            >
              <option value="">Select your goal</option>

              <option value="weight-loss">Weight Loss</option>

              <option value="maintain">Maintain Current Weight</option>

              <option value="healthy">Improve Healthy Eating</option>
            </select>
          </div>

          {/* ERROR */}

          {error && <p className="error-message">{error}</p>}

          {/* CREATE ACCOUNT */}

          <button
            type="submit"
            className="primary-button profile-button"
            disabled={loading}
          >
            {loading ? "Creating Account..." : "Create Account"}
          </button>

          {/* LOGIN */}

          <button
            type="button"
            className="secondary-button"
            onClick={() => navigate("/login")}
          >
            Already have an account? Login
          </button>
        </form>
      </div>
    </div>
  );
}

export default Profile;
