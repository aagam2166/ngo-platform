import { Link } from 'react-router-dom';

export default function Navbar() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
      <Link to="/" className="flex items-center gap-2">
        <div className="w-7 h-7 bg-orange-500 rounded-md flex items-center justify-center">
          <span className="text-white text-xs font-bold">N</span>
        </div>
        <span className="text-lg font-bold text-gray-900">
          NGO <span className="text-orange-500">Platform</span>
        </span>
      </Link>
      <div className="flex items-center gap-3">
        <Link
          to="/login"
          className="text-sm text-gray-600 hover:text-gray-900 font-medium px-3 py-2 rounded-md hover:bg-gray-100 transition-colors"
        >
          Login
        </Link>
        <Link
          to="/register"
          className="text-sm bg-orange-500 text-white px-4 py-2 rounded-md font-medium hover:bg-orange-600 transition-colors shadow-sm"
        >
          Register
        </Link>
      </div>
    </nav>
  );
}