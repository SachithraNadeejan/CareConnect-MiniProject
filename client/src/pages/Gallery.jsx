import Navbar from "../components/Navbar";

const Gallery = () => {
  const images = [
        "/assets/images/CC_1.png",
    "/assets/images/CC_2.jpg",
    "/assets/images/A2.jpg",
    "/assets/images/CC_4.jpg",
    "/assets/images/CC_3.png",
    "/assets/images/CC_4.png",
    "/assets/images/CC_5.jpg",
    "/assets/images/A3.jpg",
    "/assets/images/CC_7.jpg",
    "/assets/images/CC_8.jpg",
    "/assets/images/CC_6.jpg",
    "/assets/images/A1.jpg"

  ];
  
    return (
      <div className="flex flex-col items-center justify-center min-h-screen mt-20 mb-8">
        <Navbar/>
        <h1 className="text-3xl font-bold text-center mb-8 text-indigo-600 mt-10">
          Gallery
        </h1>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {images.map((image, index) => (
            <div
              key={index}
              className="overflow-hidden rounded-lg shadow-md bg-white"
            >
              <img
                src={image}
                alt={`Gallery item ${index + 1}`}
                className="w-full h-48 object-cover hover:scale-105 transition-transform"
              />
            </div>
          ))}
        </div>
      </div>
    );
  };
  
  export default Gallery;
  