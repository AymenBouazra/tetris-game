/* eslint-disable react/prop-types */
import { useState, useEffect, useCallback } from 'react';
import axios from '../axios';
import { useFormik } from 'formik';
import * as Yup from 'yup';
import { motion, AnimatePresence } from 'framer-motion';
import ReviewSkeleton from './ReviewSkeleton';
import ReactStars from 'react-rating-stars-component';

const Reviews = ({ stars }) => {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [isLoadingReviews, setIsLoadingReviews] = useState(false);

  const fetchReviews = async (page = 1) => {
    setLoading(true);
    try {
      const response = await axios.get(`/review?page=${page}&limit=5`);
      setReviews(response.data.reviews);
      setTotalPages(response.data.totalPages);
      setCurrentPage(response.data.currentPage);
    } catch (error) {
      console.error('Error fetching reviews:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews(currentPage);
  }, [currentPage]);

  const formik = useFormik({
    initialValues: {
      userId: JSON.parse(localStorage.getItem('user'))?._id || '',
      review: '',
      stars: 0, // Add stars to initial values
    },
    validationSchema: Yup.object({
      review: Yup.string()
        .required('Review cannot be empty')
        .max(500, 'Review must be less than 500 characters'),
      stars: Yup.number()
        .min(1, 'Please rate at least 1 star')
        .max(5, 'Maximum rating is 5 stars')
        .required('Rating is required'),
    }),
    onSubmit: async (values, { resetForm }) => {
      try {
        const response = await axios.post('/review', values);
        await axios.post('/stats', { reviews: 1 });
        setReviews([response.data, ...reviews]);
        fetchReviews(currentPage);
        resetForm();
      } catch (error) {
        console.error('Error submitting review:', error);
      }
    },
  });

  const handlePageChange = useCallback((newPage) => {
    if (isLoadingReviews) return;
    if (newPage >= 1 && newPage <= totalPages) {
      setIsLoadingReviews(true);
      setCurrentPage(newPage);

      setTimeout(() => {
        setIsLoadingReviews(false);
      }, 500);
    }
  }, [isLoadingReviews, totalPages]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="mt-8 p-8 bg-gray-800 rounded-xl shadow-2xl"
    >


      {/* Review Submission Form */}
      <form onSubmit={formik.handleSubmit} className="mb-8">
        <div className="mb-4">
          <textarea
            id="review"
            name="review"
            rows="3"
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            value={formik.values.review}
            className="w-full px-4 py-3 bg-gray-700 text-white border border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-300"
            placeholder="Write your review..."
          />
          {formik.touched.review && formik.errors.review ? (
            <div className="text-red-500 text-sm mt-1">{formik.errors.review}</div>
          ) : null}
        </div>

        {/* Star Rating Input */}
        <div className="mb-4">
          <label htmlFor="stars" className="block text-sm font-medium text-gray-300 mb-2">
            Rating
          </label>
          <ReactStars
            count={5}
            value={formik.values.stars}
            onChange={(newRating) => formik.setFieldValue('stars', newRating)}
            size={24}
            activeColor="#ffd700"
          />
          {formik.touched.stars && formik.errors.stars ? (
            <div className="text-red-500 text-sm mt-1">{formik.errors.stars}</div>
          ) : null}
        </div>

        <button
          type="submit"
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105"
        >
          Submit Review
        </button>
      </form>

      {/* Display Reviews */}
      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, index) => (
            <ReviewSkeleton key={index} />
          ))}
        </div>
      ) : (
        <motion.div className="space-y-6">
          <AnimatePresence mode="popLayout">
            <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-purple-500 mb-6">
              Reviews:
            </h2>
            {stars !== 0 ? (
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-500 mb-6">
                <ReactStars
                  count={5}
                  value={stars ? stars.toFixed(2) : 0}
                  size={20}
                  activeColor="#ffd700"
                  edit={false}
                /> {stars.toFixed(2)}
              </h2>
            ) : (
              <h2 className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-yellow-400 to-green-500 mb-6">
                No ratings yet
              </h2>
            )}
            {reviews.length !== 0 ? (
              reviews.map((review) => (
                <motion.div
                  key={review._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  transition={{ duration: 0.3 }}
                  className="p-6 bg-gray-700 rounded-xl shadow-lg hover:shadow-2xl transition-shadow duration-300"
                >
                  {/* User Name */}
                  <div className="flex items-center gap-3 mb-4">
                    <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-orange-400 to-yellow-500">
                      {review.userId?.fullname || 'Anonymous'}
                    </span>
                  </div>

                  {/* Review Text */}
                  <p className="text-white text-lg leading-relaxed mb-4">
                    {review.review}
                  </p>

                  {/* Star Rating Display */}
                  <div className="flex items-center gap-2 mb-4">
                    <ReactStars
                      count={5}
                      value={review.stars}
                      size={20}
                      activeColor="#ffd700"
                      edit={false} // Make stars non-editable
                    />
                    <span className="text-gray-400 text-sm">
                      ({review.stars} stars)
                    </span>
                  </div>

                  {/* Metadata (Highest Score and Date) */}
                  <div className="flex items-center gap-4 text-sm text-gray-400 border-t border-gray-600 pt-3">
                    <span className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-yellow-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                      Highest score: {review.userId?.highestScore}
                    </span>
                    <span className="flex items-center gap-2">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        className="h-5 w-5 text-blue-400"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path
                          fillRule="evenodd"
                          d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z"
                          clipRule="evenodd"
                        />
                      </svg>
                      Date: {new Date(review.createdAt).toLocaleString('fr-FR', { dateStyle: 'long' })}
                    </span>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="text-center text-xl text-gray-300">No reviews yet, think about adding one!</div>
            )}
          </AnimatePresence>
        </motion.div>
      )}

      {/* Pagination Controls */}
      <div className="flex justify-center mt-8 gap-3">
        <button
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          ←
        </button>
        <span className="px-6 py-3 bg-gray-700 rounded-full text-white font-bold">
          Page {currentPage} of {totalPages}
        </span>
        <button
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className="px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-bold rounded-full hover:from-blue-600 hover:to-purple-700 transition-all duration-300 transform hover:scale-105 disabled:bg-gray-500 disabled:cursor-not-allowed"
        >
          →
        </button>
      </div>
    </motion.div>
  );
};

export default Reviews;