import React from 'react';
import { FaFacebook, FaTwitter, FaInstagram } from 'react-icons/fa'; // Importar iconos de redes sociales

const Footer = () => {
  return (
    <footer className="bg-gray-900 text-white p-6 text-center shadow-inner mt-12">
      <div className="flex flex-col items-center px-4 sm:px-6 lg:px-8">
        <p className="text-lg mb-4">&copy; {new Date().getFullYear()} Tienda NovElectronic. Todos los derechos reservados.</p>
        <div className="flex space-x-6 text-2xl">
          <a href="#" className="hover:text-gray-400 transition-colors duration-200"><FaFacebook /></a>
          <a href="#" className="hover:text-gray-400 transition-colors duration-200"><FaTwitter /></a>
          <a href="#" className="hover:text-gray-400 transition-colors duration-200"><FaInstagram /></a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
