import Skeleton from 'react-loading-skeleton';
import 'react-loading-skeleton/dist/skeleton.css'

const ReviewSkeleton = () => {
 return (
  <div className="p-4 bg-gray-700 rounded-lg">
   <Skeleton height={24} width={150} className="mb-2" baseColor="#1a1a1a" highlightColor="#646cff" />
   <Skeleton count={2} baseColor="#1a1a1a" highlightColor="#646cff" />
   <div className="flex items-center gap-3 mt-2">
    <Skeleton width={100} baseColor="#1a1a1a" highlightColor="#646cff" />
    <Skeleton width={120} baseColor="#1a1a1a" highlightColor="#646cff" />
   </div>
  </div>
 );
};

export default ReviewSkeleton;