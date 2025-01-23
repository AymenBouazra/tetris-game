/* eslint-disable react/prop-types */
import { useState, useEffect } from 'react';
import axios from '../axios';
import { motion, AnimatePresence } from 'framer-motion';

const HighestScoredUsers = ({ score }) => {
 const [topUsers, setTopUsers] = useState([]);
 const [loading, setLoading] = useState(false);

 useEffect(() => {
  const fetchTopUsers = async () => {
   setLoading(true);
   try {
    const response = await axios.get('/user/highestScored');
    setTopUsers(response.data);
   } catch (error) {
    console.error('Error fetching top users:', error);
   } finally {
    setLoading(false);
   }
  };

  fetchTopUsers();
 }, [score]);

 return (
  <div className="bg-gradient-to-br from-gray-900 to-from-gray-900 p-6 rounded-lg shadow-2xl text-white">
   <h2 className="text-3xl font-bold mb-6 text-center">🏆 Top Players 🏆</h2>
   {loading ? (
    <div className="flex justify-center items-center h-32">
     <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-from-gray-900"></div>
    </div>
   ) : (
    <ul className="space-y-3">
     <AnimatePresence>
      {
       topUsers.length === 0 ? (
        <li className="text-center text-xl text-gray-300">No users found</li>
       ) : (

        topUsers.map((user, index) => (
         <motion.li
          key={user._id}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3, delay: index * 0.1 }}
          className="bg-cyan-900 bg-opacity-50 p-4 rounded-lg shadow-md hover:bg-cyan-900 transition-colors duration-200"
         >
          <span className="font-bold text-lg">
           {index + 1}. {user.fullname}
          </span>{' '}
          - <span className="text-cyan-300">{user.highestScore}</span> points
         </motion.li>
        ))

       )
      }
     </AnimatePresence>
    </ul>
   )}
  </div>
 );
};

export default HighestScoredUsers;