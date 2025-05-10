import Navbar from "../components/Navbar";

const About = () => {
  return (
    <div className="bg-gray-50 mt-10">
      <Navbar />
      <div className="flex flex-col items-center justify-center min-h-screen">
        <div className="bg-white p-8 rounded-lg shadow-sm max-w-4xl w-full border border-gray-100">
          {/* About Us Section */}
          <div className="mb-10">
            <h1 className="text-3xl font-semibold text-indigo-600 mb-4 text-center">
              About Us
            </h1>
            <p className="text-gray-700 leading-relaxed text-lg text-center">
              Care Connect is a user-friendly platform that connects donors with the Cancer Hospital in Sri Lanka, enabling the donation of nutritious meals to patients in need. We make the process simple, impactful, and meaningful for both the donors and recipients.
            </p>
          </div>

          {/* Mission Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-indigo-600 mb-4 text-center flex items-center justify-center">
              Our Mission
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg text-center">
              Our mission is to make food donations to cancer patients seamless and effective, providing comfort and nourishment through a simple, digital platform.
            </p>
          </div>

          {/* Vision Section */}
          <div className="mb-10">
            <h2 className="text-3xl font-semibold text-indigo-600 mb-4 text-center flex items-center justify-center">
              Our Vision
            </h2>
            <p className="text-gray-700 leading-relaxed text-lg text-center">
              We envision a compassionate world where technology bridges the gap between generosity and need, ensuring every cancer patient receives the support they deserve.
            </p>
          </div>

          {/* Call to Action (Optional) */}
          <div className="text-center mt-8">
            <p className="text-gray-700 mb-4 text-lg">
              Join us in making a difference today.
            </p>
           
          </div>
        </div>
      </div>
    </div>
  );
};

export default About;