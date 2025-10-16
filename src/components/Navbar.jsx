import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import valeoLogo from '../assets/Valeo_Logo.png';

function Navbar({ onSearch }) {
  const navigate = useNavigate();  const [searchQuery, setSearchQuery] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [userName, setUserName] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [profileInitial, setProfileInitial] = useState('U');
  const dropdownRef = useRef(null);  useEffect(() => {
    // Get user name and email from localStorage (stored during login)
    const storedUser = localStorage.getItem('user');
    let storedName = 'User';
    let storedEmail = 'user@valeo.com';
    
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        storedName = userObj.name || userObj.fullName || userObj.username || localStorage.getItem('userName') || 'User';
        storedEmail = userObj.email || localStorage.getItem('userEmail') || 'user@valeo.com';
      } catch (e) {
        storedName = localStorage.getItem('userName') || 'User';
        storedEmail = localStorage.getItem('userEmail') || 'user@valeo.com';
      }
    } else {
      storedName = localStorage.getItem('userName') || 'User';
      storedEmail = localStorage.getItem('userEmail') || 'user@valeo.com';
    }
    
    setUserName(storedName);
    setUserEmail(storedEmail);
    // Update profile initial based on user name
    setProfileInitial(storedName.charAt(0).toUpperCase());

    // Close dropdown when clicking outside
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);
  const handleSearch = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    if (onSearch) {
      onSearch(query);
    }
  };

  // No logout needed - authentication disabled
  
  const handleProfileClick = () => {
    setShowProfileModal(true);
    setShowDropdown(false);
  };
  const handleUpdateProfile = () => {
    // Save profile and update the initial
    localStorage.setItem('userName', userName);
    localStorage.setItem('userEmail', userEmail);
    
    // Also update the user object in localStorage
    const storedUser = localStorage.getItem('user');
    if (storedUser) {
      try {
        const userObj = JSON.parse(storedUser);
        userObj.name = userName;
        userObj.fullName = userName;
        userObj.email = userEmail;
        localStorage.setItem('user', JSON.stringify(userObj));
      } catch (e) {
        console.error('Error updating user object:', e);
      }
    }
    
    setProfileInitial(userName.charAt(0).toUpperCase());
    setShowProfileModal(false);
  };

  return (
    <nav className="bg-white shadow-md border-b-2 border-[#82E600] sticky top-0 z-40">
      <div className="max-w-[1800px] mx-auto px-4">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <img 
              src={valeoLogo} 
              alt="Valeo Logo" 
              className="h-12 w-auto object-contain cursor-pointer"
              onClick={() => navigate('/dashboard')}
            />
          </div>

          {/* Search Bar */}
          <div className="flex-1 max-w-md mx-8">
            <div className="relative">
              <input
                type="text"
                placeholder="Search for designer name, team..."
                value={searchQuery}
                onChange={handleSearch}
                className="w-full px-4 py-2 pl-10 pr-4 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>
          </div>          {/* User Actions */}
          <div className="flex items-center gap-5">
            {/* Bell Notification Icon */}
            <button className="relative p-2 text-gray-600 hover:text-[#82E600] transition-colors duration-200 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {/* Notification badge */}
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>

            {/* Star Icon */}
            <button className="p-2 text-gray-600 hover:text-[#82E600] transition-colors duration-200 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </button>

            {/* Dots Menu Icon */}
            <button className="p-2 text-gray-600 hover:text-[#82E600] transition-colors duration-200 hover:bg-gray-100 rounded-lg">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
              </svg>
            </button>

            {/* Divider */}
            <div className="h-8 w-px bg-gray-300"></div>

            {/* Profile Dropdown */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => setShowDropdown(!showDropdown)}
                className="flex items-center gap-2 p-1 hover:bg-gray-100 rounded-lg transition-colors duration-200"
              >                {/* Profile Circle with Initial */}
                <div className="w-10 h-10 bg-gradient-to-br from-[#82E600] to-[#6BC700] text-white rounded-full flex items-center justify-center font-bold text-lg shadow-md hover:shadow-lg transition-shadow duration-200">
                  {profileInitial}
                </div>
                {/* Dropdown Arrow */}
                <svg 
                  className={`w-4 h-4 text-gray-600 transition-transform duration-200 ${showDropdown ? 'rotate-180' : ''}`} 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown Menu */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-2 animate-fadeIn">
                  {/* User Info */}
                  <div className="px-4 py-3 border-b border-gray-100">
                    <p className="text-sm font-semibold text-gray-800">{userName}</p>
                    <p className="text-xs text-gray-500 mt-1">{localStorage.getItem('userEmail') || 'user@valeo.com'}</p>
                  </div>                  {/* Menu Items */}
                  <button 
                    onClick={handleProfileClick}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    My Profile
                  </button>

                  <button className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                    </svg>
                    Settings
                  </button>                  <button 
                    onClick={() => navigate('/')}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-3"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                    Dashboard Home
                  </button>
                </div>
              )}
            </div>
          </div>        </div>
      </div>      {/* Profile Modal */}
      {showProfileModal && (
        <div className="fixed inset-0 bg-white bg-opacity-90 flex items-center justify-center z-50 animate-fadeIn">
          <div className="bg-white rounded-2xl shadow-2xl w-[650px] p-8 animate-scaleIn border-2 border-[#82E600]">
            {/* Close Button */}
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setShowProfileModal(false)}
                className="text-gray-500 hover:text-[#82E600] transition-colors"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="flex gap-8">
              {/* Left Side - Profile Image */}
              <div className="flex flex-col items-center">                {/* Large Profile Circle with Initial */}
                <div className="w-24 h-24 bg-gradient-to-br from-[#82E600] to-[#6BC700] text-white rounded-full flex items-center justify-center font-bold text-4xl shadow-lg mb-4">
                  {profileInitial}
                </div>

                {/* Upload Button */}
                <label className="cursor-pointer bg-gradient-to-r from-[#82E600] to-[#6BC700] hover:from-[#6BC700] hover:to-[#82E600] text-white px-4 py-2 rounded-lg text-sm font-semibold transition-all duration-200 shadow-md hover:shadow-lg">
                  Upload
                  <input type="file" className="hidden" accept="image/*" />
                </label>                {/* Stats */}
                <div className="mt-6 text-center">
                  <p className="text-gray-600 text-xs mb-1">Documents uploaded</p>
                  <p className="text-gray-800 text-sm font-semibold mb-3">0</p>
                  <p className="text-gray-600 text-xs mb-1">No notification saved yet</p>
                </div>
              </div>

              {/* Right Side - Edit Profile Form */}
              <div className="flex-1">
                <h2 className="text-2xl font-bold text-[#82E600] mb-6">Edit Your Profile</h2>                <div className="space-y-4">
                  {/* Full Name */}
                  <div>
                    <label className="block text-gray-600 text-xs mb-2">Full Name</label>
                    <input
                      type="text"
                      value={userName}
                      onChange={(e) => setUserName(e.target.value)}
                      placeholder="Enter your full name"
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Email */}
                  <div>
                    <label className="block text-gray-600 text-xs mb-2">Email</label>
                    <input
                      type="email"
                      value={userEmail}
                      onChange={(e) => setUserEmail(e.target.value)}
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Qualification */}
                  <div>
                    <label className="block text-gray-600 text-xs mb-2">Qualification</label>
                    <input
                      type="text"
                      placeholder="Your qualification"
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Phone */}
                  <div>
                    <label className="block text-gray-600 text-xs mb-2">Phone</label>
                    <input
                      type="tel"
                      placeholder="Your phone number"
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent transition-colors"
                    />
                  </div>

                  {/* Date of Birth */}
                  <div>
                    <label className="block text-gray-600 text-xs mb-2">Date of Birth</label>
                    <input
                      type="date"
                      className="w-full bg-white text-gray-800 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-[#82E600] focus:border-transparent transition-colors"
                    />
                  </div>                  {/* Action Buttons */}
                  <div className="flex gap-3 mt-6">
                    <button
                      onClick={handleUpdateProfile}
                      className="flex-1 bg-gradient-to-r from-[#82E600] to-[#6BC700] hover:from-[#6BC700] hover:to-[#82E600] text-white py-2 rounded-lg font-semibold transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      Update Profile
                    </button>
                    <button
                      onClick={() => navigate('/dashboard')}
                      className="px-6 bg-gray-200 hover:bg-gray-300 text-gray-800 py-2 rounded-lg font-semibold transition-colors"
                    >
                      Back to Dashboard
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}

export default Navbar;
