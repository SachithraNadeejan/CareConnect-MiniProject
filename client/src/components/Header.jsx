import { useContext } from "react";
import { assets } from "../assets/assets"
import { AppContent } from "../context/AppContext.jsx";
import { useNavigate } from "react-router-dom";

const Header = () => {

  const {userData} = useContext(AppContent);
  const navigate = useNavigate();

  const handleClick = (wardId) => {
    navigate(`/donate`);
  };

  return (
    <div className="flex flex-col items-center mt-20 px-4 text-center text-gray-800">
        <img src={assets.heder_img} alt="" className="w-36 h-36 rounded-full mb-6"/>

        <h1 className="text-xl sm:text-3xl font-medium mb-2">Hey {userData ? userData.name : 'Doner'}</h1>

        <h2 className="text-3xl sm:text-5xl font-semibold mb-4">Welcome to CareConnect</h2>

        <p className="mb-8 max-w-md">Let&apos;s start with a quick tour and we will have you up and running in no time!</p>

        <button 
        onClick={handleClick}
        className="border border-grey-500 bg-indigo-600 rounded-full px-8 py-2.5 hover:bg-indigo-700 transition-all text-white">Get Started</button>

    </div>
  )
}

export default Header